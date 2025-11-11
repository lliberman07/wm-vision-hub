
-- PASO 1: Corregir moneda en schedule items del contrato LAMB1140 (USD)
UPDATE pms_payment_schedule_items 
SET currency = 'USD' 
WHERE contract_id = '49f8a4ed-2e69-43c6-9faa-a9f0932d3aff';

-- PASO 2: Corregir TODOS los schedule items que tienen moneda incorrecta
-- Actualizar schedule items para que hereden la moneda de su contrato padre
UPDATE pms_payment_schedule_items si
SET currency = c.currency
FROM pms_contracts c
WHERE si.contract_id = c.id
  AND si.currency != c.currency;

-- PASO 3: Actualizar función generate_payment_schedule_items para copiar currency
CREATE OR REPLACE FUNCTION public.generate_payment_schedule_items(contract_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  projection_rec RECORD;
  payment_method_rec RECORD;
  calculated_amount NUMERIC;
  contract_tenant_id UUID;
  contract_property_id UUID;
  contract_currency TEXT;
  owner_id_for_method UUID;
BEGIN
  -- Obtener tenant_id, property_id y currency del contrato
  SELECT tenant_id, property_id, currency 
  INTO contract_tenant_id, contract_property_id, contract_currency
  FROM pms_contracts
  WHERE id = contract_id_param;

  -- PROTEGER schedule items pagados y con pagos asociados
  DELETE FROM pms_payment_schedule_items
  WHERE contract_id = contract_id_param
    AND status != 'paid'
    AND id NOT IN (
      SELECT schedule_item_id
      FROM pms_payments
      WHERE contract_id = contract_id_param
        AND schedule_item_id IS NOT NULL
    );

  FOR projection_rec IN
    SELECT *
    FROM pms_contract_monthly_projections
    WHERE contract_id = contract_id_param
    ORDER BY period_date, item
  LOOP
    FOR payment_method_rec IN
      SELECT pm.*
      FROM pms_contract_payment_methods pm
      WHERE pm.contract_id = contract_id_param
        AND pm.item = projection_rec.item
        AND pm.percentage > 0
      ORDER BY pm.created_at
    LOOP
      calculated_amount := projection_rec.adjusted_amount * (payment_method_rec.percentage / 100.0);

      SELECT o.id INTO owner_id_for_method
      FROM pms_owners o
      JOIN pms_owner_properties op ON op.owner_id = o.id
      WHERE op.property_id = contract_property_id
        AND (op.end_date IS NULL OR op.end_date >= projection_rec.period_date)
        AND payment_method_rec.notes ILIKE '%' || o.full_name || '%'
      LIMIT 1;

      IF owner_id_for_method IS NULL THEN
        SELECT o.id INTO owner_id_for_method
        FROM pms_owner_properties op
        JOIN pms_owners o ON o.id = op.owner_id
        WHERE op.property_id = contract_property_id
          AND (op.end_date IS NULL OR op.end_date >= projection_rec.period_date)
        ORDER BY op.share_percent DESC
        LIMIT 1;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pms_payment_schedule_items
        WHERE contract_id = contract_id_param
          AND projection_id = projection_rec.id
          AND payment_method_id = payment_method_rec.id
      ) THEN
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
          status,
          accumulated_paid_amount,
          currency
        ) VALUES (
          contract_id_param,
          contract_tenant_id,
          projection_rec.id,
          owner_id_for_method,
          payment_method_rec.id,
          projection_rec.period_date,
          projection_rec.item,
          payment_method_rec.percentage,
          ROUND(calculated_amount, 2),
          CASE 
            WHEN projection_rec.period_date < CURRENT_DATE THEN 'overdue'
            ELSE 'pending'
          END,
          0,
          contract_currency
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$function$;
