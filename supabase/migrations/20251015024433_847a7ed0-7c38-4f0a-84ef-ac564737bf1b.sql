-- Corregir la función generate_payment_schedule_items para evitar duplicaciones
CREATE OR REPLACE FUNCTION public.generate_payment_schedule_items(contract_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  projection_rec RECORD;
  owner_rec RECORD;
  payment_method_rec RECORD;
  calculated_amount NUMERIC;
  item_status TEXT;
BEGIN
  -- Limpiar items existentes del contrato
  DELETE FROM pms_payment_schedule_items WHERE contract_id = contract_id_param;

  -- Iterar sobre todas las proyecciones del contrato
  FOR projection_rec IN
    SELECT * FROM pms_contract_monthly_projections
    WHERE contract_id = contract_id_param
    ORDER BY period_date, item
  LOOP
    -- Para cada proyección, crear un item por cada PROPIETARIO (no por payment method)
    FOR owner_rec IN
      SELECT op.owner_id, op.share_percent, o.id as owner_id
      FROM pms_owner_properties op
      LEFT JOIN pms_owners o ON o.id = op.owner_id
      WHERE op.property_id = (
        SELECT property_id FROM pms_contracts WHERE id = contract_id_param
      )
      AND (op.end_date IS NULL OR op.end_date >= projection_rec.period_date)
      AND op.share_percent > 0
    LOOP
      -- Buscar el primer método de pago disponible para este item
      SELECT * INTO payment_method_rec
      FROM pms_contract_payment_methods
      WHERE contract_id = contract_id_param
        AND item = projection_rec.item
      LIMIT 1;

      -- Si no hay método de pago configurado, saltar
      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      -- Calcular monto esperado: monto_ajustado × porcentaje del propietario
      calculated_amount := projection_rec.adjusted_amount * (owner_rec.share_percent / 100);

      -- Determinar estado inicial
      IF projection_rec.period_date < CURRENT_DATE THEN
        item_status := 'overdue';
      ELSE
        item_status := 'pending';
      END IF;

      -- Insertar UN SOLO item por propietario
      INSERT INTO pms_payment_schedule_items (
        contract_id,
        tenant_id,
        projection_id,
        owner_id,
        payment_method_id,
        period_date,
        item,
        owner_percentage,
        expected_amount,
        status
      ) VALUES (
        contract_id_param,
        projection_rec.tenant_id,
        projection_rec.id,
        owner_rec.owner_id,
        payment_method_rec.id,
        projection_rec.period_date,
        projection_rec.item,
        owner_rec.share_percent,
        calculated_amount,
        item_status
      );
    END LOOP;
  END LOOP;
END;
$function$;