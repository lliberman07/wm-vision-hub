-- Fix approve_payment_submission: link payment to schedule_item and store currency info
CREATE OR REPLACE FUNCTION public.approve_payment_submission(submission_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  submission_rec RECORD;
  v_payment_id UUID;
  v_schedule_item RECORD;
  v_new_accumulated NUMERIC;
  v_new_status TEXT;
BEGIN
  -- Obtener submission con datos de moneda
  SELECT ps.*, 
         c.currency as contract_currency_from_contract,
         COALESCE(ps.contract_currency, c.currency, 'ARS') as effective_contract_currency,
         COALESCE(ps.amount_in_contract_currency, ps.paid_amount) as effective_amount
  INTO submission_rec
  FROM pms_payment_submissions ps
  JOIN pms_contracts c ON c.id = ps.contract_id
  WHERE ps.id = submission_id_param
    AND ps.status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission no encontrada o ya procesada';
  END IF;

  -- Obtener schedule item
  SELECT * INTO v_schedule_item
  FROM pms_payment_schedule_items
  WHERE id = submission_rec.schedule_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule item no encontrado';
  END IF;

  -- Crear registro de pago con schedule_item_id y datos de moneda
  INSERT INTO pms_payments (
    contract_id, 
    tenant_id, 
    schedule_item_id,
    payment_type,
    amount, 
    paid_amount,
    currency,
    contract_currency,
    exchange_rate,
    amount_in_contract_currency,
    due_date, 
    paid_date, 
    status, 
    payment_method,
    reference_number, 
    receipt_url, 
    notes
  ) VALUES (
    submission_rec.contract_id,
    submission_rec.tenant_id,
    submission_rec.schedule_item_id,
    'rent',
    submission_rec.effective_amount,
    submission_rec.paid_amount,
    submission_rec.effective_contract_currency,
    submission_rec.contract_currency,
    submission_rec.exchange_rate,
    submission_rec.amount_in_contract_currency,
    v_schedule_item.period_date::date,
    submission_rec.paid_date,
    'paid',
    submission_rec.payment_method,
    submission_rec.reference_number,
    submission_rec.receipt_url,
    submission_rec.notes
  )
  RETURNING id INTO v_payment_id;

  -- Calcular nuevo acumulado
  v_new_accumulated := COALESCE(v_schedule_item.accumulated_paid_amount, 0) + submission_rec.effective_amount;

  -- Determinar nuevo estado
  IF v_new_accumulated >= v_schedule_item.expected_amount THEN
    v_new_status := 'paid';
  ELSIF v_new_accumulated > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := v_schedule_item.status;
  END IF;

  -- Actualizar schedule item con payment_id vinculado
  UPDATE pms_payment_schedule_items
  SET accumulated_paid_amount = v_new_accumulated,
      status = v_new_status,
      payment_id = v_payment_id,
      updated_at = NOW()
  WHERE id = submission_rec.schedule_item_id;

  -- Actualizar submission como aprobada con payment_id
  UPDATE pms_payment_submissions
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = NOW(),
      payment_id = v_payment_id,
      updated_at = NOW()
  WHERE id = submission_id_param;

END;
$$;