-- PASO 0: Eliminar el pago erróneo de $100,000 en Agosto Item A (si existe)
DELETE FROM pms_payments
WHERE id = '04403442-47e6-4cec-9b1a-9c4669fbdd5a';

-- PASO 1: Reconstruir Schedule Items Históricos con IDs Originales

-- Recrear los schedule items directamente usando los datos de los pagos
INSERT INTO pms_payment_schedule_items (
  id,
  contract_id,
  tenant_id,
  projection_id,
  owner_id,
  payment_method_id,
  period_date,
  item,
  owner_percentage,
  expected_amount,
  accumulated_paid_amount,
  status,
  created_at,
  updated_at
)
SELECT 
  p.schedule_item_id as id,
  p.contract_id,
  c.tenant_id,
  proj.id as projection_id,
  CASE 
    WHEN p.paid_amount IN (300000, 120000) THEN
      (SELECT o.id FROM pms_owners o 
       JOIN pms_owner_properties op ON op.owner_id = o.id
       WHERE op.property_id = c.property_id 
         AND o.full_name LIKE '%LEONARDO%'
         AND (op.end_date IS NULL OR op.end_date >= proj.period_date)
       LIMIT 1)
    ELSE
      (SELECT o.id FROM pms_owners o 
       JOIN pms_owner_properties op ON op.owner_id = o.id
       WHERE op.property_id = c.property_id 
         AND o.full_name LIKE '%ACTUALTECH%'
         AND (op.end_date IS NULL OR op.end_date >= proj.period_date)
       LIMIT 1)
  END as owner_id,
  CASE 
    WHEN p.paid_amount IN (300000, 120000) THEN
      (SELECT pm.id FROM pms_contract_payment_methods pm
       WHERE pm.contract_id = p.contract_id
         AND pm.item = p.item
         AND pm.percentage = 60
       LIMIT 1)
    ELSE
      (SELECT pm.id FROM pms_contract_payment_methods pm
       WHERE pm.contract_id = p.contract_id
         AND pm.item = p.item
         AND pm.percentage = 40
       LIMIT 1)
  END as payment_method_id,
  proj.period_date,
  proj.item,
  CASE WHEN p.paid_amount IN (300000, 120000) THEN 60 ELSE 40 END as owner_percentage,
  p.paid_amount as expected_amount,
  p.paid_amount as accumulated_paid_amount,
  'paid' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM pms_payments p
JOIN pms_contracts c ON c.id = p.contract_id
JOIN pms_contract_monthly_projections proj ON 
  proj.contract_id = p.contract_id 
  AND proj.item = p.item
  AND DATE_TRUNC('month', proj.period_date) = DATE_TRUNC('month', p.paid_date)
WHERE p.contract_id = 'c7986757-cf43-442e-88d0-1f12ef085de2'
  AND p.schedule_item_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM pms_payment_schedule_items psi2
    WHERE psi2.id = p.schedule_item_id
  )
ON CONFLICT (id) DO NOTHING;

-- PASO 2: Corregir Función generate_payment_schedule_items
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
  owner_id_for_method UUID;
BEGIN
  SELECT tenant_id, property_id 
  INTO contract_tenant_id, contract_property_id
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
          accumulated_paid_amount
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
          0
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$function$;

-- PASO 3: Regenerar Schedule Items Futuros
SELECT generate_payment_schedule_items('c7986757-cf43-442e-88d0-1f12ef085de2'::UUID);