
-- Mejorar la función link_existing_payments_to_schedule para vincular TODOS los pagos
CREATE OR REPLACE FUNCTION public.link_existing_payments_to_schedule(contract_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payment_rec RECORD;
  schedule_item_rec RECORD;
  linked_count INTEGER := 0;
BEGIN
  -- Para cada pago del contrato que no esté vinculado
  FOR payment_rec IN
    SELECT p.* 
    FROM pms_payments p
    WHERE p.contract_id = contract_id_param
      AND p.status IN ('paid', 'partial')
      AND NOT EXISTS (
        SELECT 1 FROM pms_payment_schedule_items 
        WHERE payment_id = p.id
      )
    ORDER BY p.paid_date, p.created_at
  LOOP
    -- Buscar schedule item del mismo período que no tenga pago asignado
    -- Intentar vincular con el primer item disponible que tenga monto similar
    SELECT * INTO schedule_item_rec
    FROM pms_payment_schedule_items
    WHERE contract_id = contract_id_param
      AND DATE_TRUNC('month', period_date) = DATE_TRUNC('month', payment_rec.paid_date)
      AND payment_id IS NULL
      AND ABS(expected_amount - payment_rec.paid_amount) < 1000  -- Tolerancia de diferencia
    ORDER BY expected_amount DESC
    LIMIT 1;
    
    -- Si no encontró con monto similar, buscar cualquiera del período
    IF NOT FOUND THEN
      SELECT * INTO schedule_item_rec
      FROM pms_payment_schedule_items
      WHERE contract_id = contract_id_param
        AND DATE_TRUNC('month', period_date) = DATE_TRUNC('month', payment_rec.paid_date)
        AND payment_id IS NULL
      ORDER BY expected_amount DESC
      LIMIT 1;
    END IF;
    
    IF FOUND THEN
      -- Vincular pago con schedule item
      UPDATE pms_payment_schedule_items
      SET payment_id = payment_rec.id,
          status = 'paid',
          updated_at = NOW()
      WHERE id = schedule_item_rec.id;
      
      linked_count := linked_count + 1;
    ELSE
      -- Si no hay schedule items disponibles, crear uno nuevo para este pago
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
        payment_id,
        status
      )
      SELECT 
        payment_rec.contract_id,
        payment_rec.tenant_id,
        p.id,  -- projection_id
        op.owner_id,
        pm.id,  -- payment_method_id
        DATE_TRUNC('month', payment_rec.paid_date)::date,
        'A',  -- item por defecto
        op.share_percent,
        payment_rec.paid_amount * (op.share_percent / 100),
        payment_rec.id,
        'paid'
      FROM pms_contracts c
      LEFT JOIN pms_contract_monthly_projections p ON p.contract_id = c.id 
        AND DATE_TRUNC('month', p.period_date) = DATE_TRUNC('month', payment_rec.paid_date)
        AND p.item = 'A'
      LEFT JOIN pms_owner_properties op ON op.property_id = c.property_id
        AND (op.end_date IS NULL OR op.end_date >= payment_rec.paid_date)
      LEFT JOIN pms_contract_payment_methods pm ON pm.contract_id = c.id
        AND pm.item = 'A'
      WHERE c.id = payment_rec.contract_id
      LIMIT 1;
      
      linked_count := linked_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Vinculados % pagos al calendario', linked_count;
END;
$function$;
