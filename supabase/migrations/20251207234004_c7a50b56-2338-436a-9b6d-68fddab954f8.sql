-- Primero eliminar la función existente para poder cambiar el tipo de retorno
DROP FUNCTION IF EXISTS public.get_property_auto_status(uuid);

-- Recrear get_property_auto_status con tipo de retorno correcto (property_status)
CREATE FUNCTION public.get_property_auto_status(property_id_param uuid)
RETURNS property_status
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_contract RECORD;
  manual_status property_status;
BEGIN
  -- Obtener estado actual de la propiedad
  SELECT status INTO manual_status
  FROM pms_properties
  WHERE id = property_id_param;

  -- Si está en mantenimiento manual, respetar ese estado
  IF manual_status = 'maintenance'::property_status THEN
    RETURN 'maintenance'::property_status;
  END IF;

  -- Buscar contrato activo vigente
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
    RETURN 'rented'::property_status;
  ELSE
    -- Sin contrato vigente → Disponible (active en el ENUM)
    RETURN 'active'::property_status;
  END IF;
END;
$$;

-- Recrear update_property_status_on_contract_change con tipos ENUM correctos
CREATE OR REPLACE FUNCTION public.update_property_status_on_contract_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_status property_status;
  current_status property_status;
BEGIN
  -- Obtener estado actual de la propiedad
  SELECT status INTO current_status
  FROM pms_properties
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);

  -- Solo actualizar si NO está en mantenimiento manual
  IF current_status IS DISTINCT FROM 'maintenance'::property_status THEN
    new_status := get_property_auto_status(COALESCE(NEW.property_id, OLD.property_id));
    
    UPDATE pms_properties
    SET status = new_status,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recrear cancel_contract corrigiendo 'available' a 'active'
CREATE OR REPLACE FUNCTION public.cancel_contract(
  p_contract_id uuid,
  p_reason text DEFAULT NULL,
  p_cancelled_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract RECORD;
  v_property_id uuid;
  v_tenant_id uuid;
  v_current_status property_status;
BEGIN
  -- Obtener datos del contrato
  SELECT * INTO v_contract
  FROM pms_contracts
  WHERE id = p_contract_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contrato no encontrado');
  END IF;

  IF v_contract.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'El contrato ya está cancelado');
  END IF;

  v_property_id := v_contract.property_id;
  v_tenant_id := v_contract.tenant_id;

  -- Cancelar el contrato
  UPDATE pms_contracts
  SET 
    status = 'cancelled',
    cancellation_reason = p_reason,
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    updated_at = NOW()
  WHERE id = p_contract_id;

  -- Cancelar pagos pendientes del contrato
  UPDATE pms_payments
  SET 
    status = 'cancelled',
    notes = COALESCE(notes, '') || ' [Cancelado por cancelación de contrato]',
    updated_at = NOW()
  WHERE contract_id = p_contract_id
    AND status IN ('pending', 'partial');

  -- Cancelar items del schedule pendientes
  UPDATE pms_payment_schedule_items
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE contract_id = p_contract_id
    AND status IN ('pending', 'partial');

  -- Actualizar estado de la propiedad
  SELECT status INTO v_current_status
  FROM pms_properties
  WHERE id = v_property_id;

  IF v_current_status IS DISTINCT FROM 'maintenance'::property_status THEN
    UPDATE pms_properties
    SET 
      status = 'active'::property_status,
      updated_at = NOW()
    WHERE id = v_property_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Contrato cancelado exitosamente',
    'contract_id', p_contract_id
  );
END;
$$;