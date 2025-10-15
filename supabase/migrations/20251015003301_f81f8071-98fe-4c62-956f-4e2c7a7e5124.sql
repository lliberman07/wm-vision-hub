-- Mejorar función activate_contract con validaciones adicionales
CREATE OR REPLACE FUNCTION public.activate_contract(contract_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contract_rec RECORD;
  owners_count INTEGER;
  payment_methods_total NUMERIC;
  indices_count INTEGER;
BEGIN
  -- Obtener contrato
  SELECT * INTO contract_rec
  FROM pms_contracts
  WHERE id = contract_id_param
    AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado o no está en borrador';
  END IF;

  -- Validación 1: Verificar que existan propietarios activos
  SELECT COUNT(*) INTO owners_count
  FROM pms_owner_properties
  WHERE property_id = contract_rec.property_id
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    AND share_percent > 0;

  IF owners_count = 0 THEN
    RAISE EXCEPTION 'La propiedad debe tener al menos un propietario activo asignado';
  END IF;

  -- Validación 2: Verificar que existan métodos de pago y sumen 100%
  SELECT COALESCE(SUM(percentage), 0) INTO payment_methods_total
  FROM pms_contract_payment_methods
  WHERE contract_id = contract_id_param;

  IF payment_methods_total = 0 THEN
    RAISE EXCEPTION 'Debe configurar al menos un método de pago';
  END IF;

  IF payment_methods_total != 100 THEN
    RAISE EXCEPTION 'Los métodos de pago deben sumar exactamente 100 por ciento (actualmente: % por ciento)', payment_methods_total;
  END IF;

  -- Validación 3: Si tiene ajustes por índice, verificar que existan índices cargados
  IF contract_rec.indice_ajuste IS NOT NULL AND contract_rec.fecha_primer_ajuste IS NOT NULL THEN
    SELECT COUNT(*) INTO indices_count
    FROM pms_economic_indices
    WHERE index_type = contract_rec.indice_ajuste
      AND tenant_id = contract_rec.tenant_id;

    IF indices_count = 0 THEN
      RAISE EXCEPTION 'No existen índices económicos cargados para el tipo: %', contract_rec.indice_ajuste;
    END IF;
  END IF;

  -- Validar que no exista otro contrato activo para la propiedad
  IF EXISTS (
    SELECT 1 FROM pms_contracts
    WHERE property_id = contract_rec.property_id
      AND status = 'active'
      AND id != contract_id_param
  ) THEN
    RAISE EXCEPTION 'Ya existe un contrato activo para esta propiedad';
  END IF;

  -- Activar contrato
  UPDATE pms_contracts
  SET status = 'active',
      updated_at = NOW()
  WHERE id = contract_id_param;

  -- Generar proyecciones mensuales
  PERFORM generate_contract_monthly_projections(contract_id_param);

  -- Generar items de calendario de pagos
  PERFORM generate_payment_schedule_items(contract_id_param);

  -- Actualizar estado de propiedad
  UPDATE pms_properties
  SET status = 'rented',
      updated_at = NOW()
  WHERE id = contract_rec.property_id
    AND status != 'maintenance';
END;
$function$;

-- Crear función para extender contratos vencidos
CREATE OR REPLACE FUNCTION public.extend_contract(
  contract_id_param uuid,
  new_end_date_param date,
  notes_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contract_rec RECORD;
BEGIN
  -- Obtener contrato
  SELECT * INTO contract_rec
  FROM pms_contracts
  WHERE id = contract_id_param
    AND status = 'expired';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado o no está vencido';
  END IF;

  -- Validar que la nueva fecha sea posterior a la actual
  IF new_end_date_param <= contract_rec.end_date THEN
    RAISE EXCEPTION 'La nueva fecha de finalización debe ser posterior a la fecha actual (%)' , contract_rec.end_date;
  END IF;

  -- Actualizar contrato
  UPDATE pms_contracts
  SET end_date = new_end_date_param,
      status = 'active',
      updated_at = NOW()
  WHERE id = contract_id_param;

  -- Registrar la extensión en ajustes
  INSERT INTO pms_contract_adjustments (
    contract_id,
    tenant_id,
    application_date,
    index_type,
    previous_amount,
    variation_percent,
    new_amount,
    item,
    audit_json
  ) VALUES (
    contract_id_param,
    contract_rec.tenant_id,
    CURRENT_DATE,
    'EXTENSION',
    0,
    0,
    0,
    'EXTENSION',
    jsonb_build_object(
      'previous_end_date', contract_rec.end_date,
      'new_end_date', new_end_date_param,
      'notes', notes_param,
      'extended_at', NOW()
    )
  );

  -- Regenerar proyecciones y calendario
  PERFORM generate_contract_monthly_projections(contract_id_param);
  PERFORM generate_payment_schedule_items(contract_id_param);

  -- Actualizar estado de propiedad
  UPDATE pms_properties
  SET status = 'rented',
      updated_at = NOW()
  WHERE id = contract_rec.property_id
    AND status != 'maintenance';
END;
$function$;