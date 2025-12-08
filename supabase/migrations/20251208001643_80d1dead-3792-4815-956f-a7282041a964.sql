-- Actualizar activate_contract removiendo la llamada a net.http_post
-- Las notificaciones se enviarán desde el frontend

CREATE OR REPLACE FUNCTION public.activate_contract(contract_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  contract_rec RECORD;
  owners_count INTEGER;
  payment_methods_total_a NUMERIC;
  payment_methods_total_b NUMERIC;
  has_item_b BOOLEAN;
  indices_count INTEGER;
  has_forma_pago_a BOOLEAN;
  has_forma_pago_b BOOLEAN;
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

  -- Verificar si hay forma de pago configurada directamente en el contrato
  has_forma_pago_a := contract_rec.forma_pago_item_a IS NOT NULL AND contract_rec.forma_pago_item_a != '';
  has_forma_pago_b := contract_rec.forma_pago_item_b IS NOT NULL AND contract_rec.forma_pago_item_b != '';

  -- Validación 2: Verificar métodos de pago para Item A
  SELECT COALESCE(SUM(percentage), 0) INTO payment_methods_total_a
  FROM pms_contract_payment_methods
  WHERE contract_id = contract_id_param
    AND item = 'A';

  -- Item A es válido si tiene registros en payment_methods que sumen 100% 
  -- O si tiene forma_pago_item_a configurado directamente
  IF payment_methods_total_a = 0 AND NOT has_forma_pago_a THEN
    RAISE EXCEPTION 'Debe configurar al menos un método de pago para el Item A';
  END IF;

  -- Si usa payment_methods, validar que sume 100%
  IF payment_methods_total_a > 0 AND payment_methods_total_a != 100 THEN
    RAISE EXCEPTION 'Los métodos de pago del Item A deben sumar exactamente 100 por ciento (actualmente: % por ciento)', payment_methods_total_a;
  END IF;

  -- Validación para Item B (solo si tiene monto_b > 0)
  has_item_b := COALESCE(contract_rec.monto_b, 0) > 0;

  IF has_item_b THEN
    SELECT COALESCE(SUM(percentage), 0) INTO payment_methods_total_b
    FROM pms_contract_payment_methods
    WHERE contract_id = contract_id_param
      AND item = 'B';

    -- Item B es válido si tiene registros en payment_methods que sumen 100% 
    -- O si tiene forma_pago_item_b configurado directamente
    IF payment_methods_total_b = 0 AND NOT has_forma_pago_b THEN
      RAISE EXCEPTION 'Debe configurar al menos un método de pago para el Item B';
    END IF;

    -- Si usa payment_methods, validar que sume 100%
    IF payment_methods_total_b > 0 AND payment_methods_total_b != 100 THEN
      RAISE EXCEPTION 'Los métodos de pago del Item B deben sumar exactamente 100 por ciento (actualmente: % por ciento)', payment_methods_total_b;
    END IF;
  END IF;

  -- Validación 3: Si tiene ajustes por índice, verificar que existan índices cargados
  IF contract_rec.indice_ajuste IS NOT NULL AND contract_rec.fecha_primer_ajuste IS NOT NULL THEN
    SELECT COUNT(*) INTO indices_count
    FROM pms_economic_indices
    WHERE index_type = contract_rec.indice_ajuste;

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

  -- NOTA: Las notificaciones se envían desde el frontend
  -- usando supabase.functions.invoke('send-contract-activation-notification')
END;
$function$;