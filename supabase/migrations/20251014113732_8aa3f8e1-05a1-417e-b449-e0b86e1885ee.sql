-- 1. Agregar campos de cancelación a pms_contracts
ALTER TABLE pms_contracts
ADD COLUMN IF NOT EXISTS cancelled_at DATE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);

-- 2. Función para calcular estado automático de propiedades
CREATE OR REPLACE FUNCTION get_property_auto_status(property_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  active_contract RECORD;
  manual_status TEXT;
BEGIN
  -- Obtener estado actual de la propiedad
  SELECT status INTO manual_status
  FROM pms_properties
  WHERE id = property_id_param;

  -- Si está en mantenimiento manual, respetar ese estado
  IF manual_status = 'maintenance' THEN
    RETURN 'maintenance';
  END IF;

  -- Buscar contrato activo vigente (no cancelado)
  SELECT * INTO active_contract
  FROM pms_contracts
  WHERE property_id = property_id_param
    AND status = 'active'
    AND end_date >= CURRENT_DATE
    AND start_date <= CURRENT_DATE
  ORDER BY start_date DESC
  LIMIT 1;

  -- Si existe contrato vigente → Alquilada
  IF FOUND THEN
    RETURN 'rented';
  ELSE
    -- Sin contrato vigente → Disponible
    RETURN 'available';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Función para cancelar contratos
CREATE OR REPLACE FUNCTION cancel_contract(
  contract_id_param UUID,
  cancellation_date_param DATE,
  cancellation_reason_param TEXT,
  cancelled_by_param UUID
)
RETURNS void AS $$
DECLARE
  contract_record RECORD;
  property_maintenance_status BOOLEAN;
BEGIN
  -- Obtener contrato
  SELECT * INTO contract_record
  FROM pms_contracts
  WHERE id = contract_id_param
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado o no está activo';
  END IF;

  -- Validar que la fecha de cancelación sea válida
  IF cancellation_date_param < contract_record.start_date THEN
    RAISE EXCEPTION 'La fecha de cancelación no puede ser anterior a la fecha de inicio del contrato';
  END IF;

  IF cancellation_date_param > contract_record.end_date THEN
    RAISE EXCEPTION 'La fecha de cancelación no puede ser posterior a la fecha de fin del contrato';
  END IF;

  -- Actualizar contrato
  UPDATE pms_contracts
  SET status = 'cancelled',
      cancelled_at = cancellation_date_param,
      cancellation_reason = cancellation_reason_param,
      cancelled_by = cancelled_by_param,
      updated_at = NOW()
  WHERE id = contract_id_param;

  -- Cancelar pagos futuros (desde fecha_cancelacion en adelante)
  UPDATE pms_payments
  SET status = 'cancelled',
      notes = COALESCE(notes || E'\n', '') || 'Cancelado por cancelación de contrato el ' || cancellation_date_param::TEXT,
      updated_at = NOW()
  WHERE contract_id = contract_id_param
    AND status = 'pending'
    AND due_date >= cancellation_date_param;

  -- Verificar si la propiedad está manualmente en mantenimiento
  SELECT (status = 'maintenance') INTO property_maintenance_status
  FROM pms_properties
  WHERE id = contract_record.property_id;

  -- Actualizar estado de propiedad solo si no está en mantenimiento manual
  IF NOT property_maintenance_status THEN
    UPDATE pms_properties
    SET status = 'available',
        updated_at = NOW()
    WHERE id = contract_record.property_id;
  END IF;

  -- Log de auditoría
  INSERT INTO pms_contract_adjustments (
    contract_id, tenant_id, application_date,
    index_type, previous_amount, variation_percent,
    new_amount, item, audit_json
  ) VALUES (
    contract_id_param, contract_record.tenant_id, cancellation_date_param,
    'CANCELACION', 0, 0, 0, 'CANCELACION',
    jsonb_build_object(
      'cancellation_reason', cancellation_reason_param,
      'cancelled_by', cancelled_by_param,
      'cancelled_at', cancellation_date_param
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Trigger para actualización automática de estados
CREATE OR REPLACE FUNCTION update_property_status_on_contract_change()
RETURNS TRIGGER AS $$
DECLARE
  new_status TEXT;
  current_status TEXT;
BEGIN
  -- Obtener estado actual
  SELECT status INTO current_status
  FROM pms_properties
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);

  -- Solo actualizar si NO está en mantenimiento manual
  IF current_status != 'maintenance' THEN
    new_status := get_property_auto_status(COALESCE(NEW.property_id, OLD.property_id));
    
    UPDATE pms_properties
    SET status = new_status,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_property_status_after_contract ON pms_contracts;
CREATE TRIGGER trigger_update_property_status_after_contract
AFTER INSERT OR UPDATE OR DELETE ON pms_contracts
FOR EACH ROW
EXECUTE FUNCTION update_property_status_on_contract_change();

-- 5. Función para verificar contratos vencidos (job diario)
CREATE OR REPLACE FUNCTION check_expired_contracts()
RETURNS void AS $$
DECLARE
  expired_contract RECORD;
BEGIN
  -- Buscar contratos que vencieron ayer
  FOR expired_contract IN
    SELECT DISTINCT property_id, id
    FROM pms_contracts
    WHERE status = 'active'
      AND end_date = CURRENT_DATE - INTERVAL '1 day'
  LOOP
    -- Cambiar status del contrato a 'expired'
    UPDATE pms_contracts
    SET status = 'expired',
        updated_at = NOW()
    WHERE id = expired_contract.id;

    -- Actualizar estado de propiedad (respetando mantenimiento manual)
    UPDATE pms_properties
    SET status = get_property_auto_status(expired_contract.property_id),
        updated_at = NOW()
    WHERE id = expired_contract.property_id
      AND status != 'maintenance';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Migrar estados de propiedades existentes
DO $$
DECLARE
  prop RECORD;
BEGIN
  FOR prop IN SELECT id FROM pms_properties WHERE status != 'maintenance'
  LOOP
    UPDATE pms_properties
    SET status = get_property_auto_status(prop.id),
        updated_at = NOW()
    WHERE id = prop.id;
  END LOOP;
END $$;