-- Actualizar función link_existing_payments_to_schedule para que vincule TODOS los pagos
-- no solo los que coinciden exactamente con el monto esperado

CREATE OR REPLACE FUNCTION public.link_existing_payments_to_schedule(contract_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payment_rec RECORD;
  schedule_item_rec RECORD;
BEGIN
  -- Para cada pago del contrato que no esté vinculado
  FOR payment_rec IN
    SELECT p.* 
    FROM pms_payments p
    WHERE p.contract_id = contract_id_param
      AND p.status = 'paid'
      AND NOT EXISTS (
        SELECT 1 FROM pms_payment_schedule_items 
        WHERE payment_id = p.id
      )
    ORDER BY p.paid_date, p.created_at
  LOOP
    -- Buscar schedule item del mismo período que no tenga pago asignado
    SELECT * INTO schedule_item_rec
    FROM pms_payment_schedule_items
    WHERE contract_id = contract_id_param
      AND DATE_TRUNC('month', period_date) = DATE_TRUNC('month', payment_rec.paid_date)
      AND payment_id IS NULL
    ORDER BY expected_amount DESC
    LIMIT 1;
    
    IF FOUND THEN
      -- Vincular pago con schedule item
      UPDATE pms_payment_schedule_items
      SET payment_id = payment_rec.id,
          status = 'paid',
          updated_at = NOW()
      WHERE id = schedule_item_rec.id;
      
      RAISE NOTICE 'Vinculado pago % con schedule item %', payment_rec.id, schedule_item_rec.id;
    END IF;
  END LOOP;
END;
$function$;