-- Corregir la función approve_payment_submission para usar las columnas correctas de pms_payments
CREATE OR REPLACE FUNCTION approve_payment_submission(submission_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_rec RECORD;
  schedule_item_rec RECORD;
  new_payment_id uuid;
  effective_amount NUMERIC;
  effective_contract_currency TEXT;
  new_accumulated NUMERIC;
  new_status TEXT;
  contract_rec RECORD;
BEGIN
  SELECT * INTO submission_rec
  FROM pms_payment_submissions
  WHERE id = submission_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission not found');
  END IF;
  
  IF submission_rec.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submission already processed');
  END IF;
  
  SELECT * INTO schedule_item_rec
  FROM pms_payment_schedule_items
  WHERE id = submission_rec.schedule_item_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Schedule item not found');
  END IF;
  
  SELECT * INTO contract_rec
  FROM pms_contracts
  WHERE id = submission_rec.contract_id;
  
  effective_contract_currency := COALESCE(contract_rec.currency, 'ARS');
  
  IF submission_rec.payment_currency = effective_contract_currency THEN
    effective_amount := submission_rec.paid_amount;
  ELSIF submission_rec.exchange_rate IS NOT NULL AND submission_rec.exchange_rate > 0 THEN
    effective_amount := submission_rec.paid_amount / submission_rec.exchange_rate;
  ELSE
    effective_amount := submission_rec.paid_amount;
  END IF;
  
  -- Insertar usando las columnas que realmente existen en pms_payments
  INSERT INTO pms_payments (
    contract_id,
    tenant_id,
    schedule_item_id,
    submission_id,
    due_date,
    paid_date,
    paid_amount,
    amount,
    currency,
    contract_currency,
    exchange_rate,
    amount_in_contract_currency,
    payment_method,
    receipt_url,
    notes,
    status,
    payment_type
  ) VALUES (
    submission_rec.contract_id,
    submission_rec.tenant_id,
    submission_rec.schedule_item_id,
    submission_id_param,
    submission_rec.payment_date,
    submission_rec.payment_date,
    effective_amount,
    submission_rec.paid_amount,
    submission_rec.payment_currency,
    effective_contract_currency,
    submission_rec.exchange_rate,
    effective_amount,
    submission_rec.payment_method,
    submission_rec.receipt_url,
    submission_rec.notes,
    'paid',
    'rent'
  )
  RETURNING id INTO new_payment_id;
  
  new_accumulated := COALESCE(schedule_item_rec.accumulated_paid_amount, 0) + effective_amount;
  
  IF new_accumulated >= schedule_item_rec.expected_amount THEN
    new_status := 'paid';
  ELSIF new_accumulated > 0 THEN
    new_status := 'partial';
  ELSE
    new_status := schedule_item_rec.status;
  END IF;
  
  UPDATE pms_payment_schedule_items
  SET 
    accumulated_paid_amount = new_accumulated,
    status = new_status,
    updated_at = NOW()
  WHERE id = submission_rec.schedule_item_id;
  
  UPDATE pms_payment_submissions
  SET 
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    payment_id = new_payment_id
  WHERE id = submission_id_param;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', new_payment_id,
    'effective_amount', effective_amount,
    'payment_currency', submission_rec.payment_currency,
    'contract_currency', effective_contract_currency,
    'new_status', new_status,
    'accumulated', new_accumulated
  );
END;
$$;