
-- Fix December 2025 payment: replicate November 2025 schema
-- Source: submission f64c9531-a8c9-4dd3-9696-8721feb2c3ce has the correct data

-- 1. Update pms_payments with schedule_item_id and currency conversion data
UPDATE pms_payments 
SET schedule_item_id = '97bdfe99-6785-4507-b253-e61f637c68fb',
    contract_currency = 'USD',
    exchange_rate = 1460.00,
    amount_in_contract_currency = 500.00,
    updated_at = NOW()
WHERE id = '7892c1f5-8a70-4a54-b014-67618ace308d';

-- 2. Update pms_payment_schedule_items with payment_id link
UPDATE pms_payment_schedule_items
SET payment_id = '7892c1f5-8a70-4a54-b014-67618ace308d',
    updated_at = NOW()
WHERE id = '97bdfe99-6785-4507-b253-e61f637c68fb';

-- 3. Create diagnostic function to detect future issues
CREATE OR REPLACE FUNCTION public.diagnose_payment_issues(p_tenant_id uuid DEFAULT NULL)
RETURNS TABLE(
  issue_type text,
  payment_id uuid,
  schedule_item_id uuid,
  contract_id uuid,
  period_date date,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Issue 1: Payments without schedule_item_id
  RETURN QUERY
  SELECT 
    'payment_missing_schedule_item'::text,
    p.id,
    p.schedule_item_id,
    p.contract_id,
    p.paid_date::date,
    format('Payment %s has no schedule_item_id', p.id)::text
  FROM pms_payments p
  WHERE p.schedule_item_id IS NULL
    AND (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id);

  -- Issue 2: Paid schedule_items without payment_id
  RETURN QUERY
  SELECT 
    'schedule_item_missing_payment'::text,
    psi.payment_id,
    psi.id,
    psi.contract_id,
    psi.period_date,
    format('Schedule item %s is paid but has no payment_id', psi.id)::text
  FROM pms_payment_schedule_items psi
  WHERE psi.status = 'paid'
    AND psi.payment_id IS NULL
    AND (p_tenant_id IS NULL OR psi.tenant_id = p_tenant_id);

  -- Issue 3: Multi-currency payments missing conversion data
  RETURN QUERY
  SELECT 
    'missing_currency_conversion'::text,
    p.id,
    p.schedule_item_id,
    p.contract_id,
    p.paid_date::date,
    format('Payment %s: currency=%s but contract_currency=%s, missing exchange_rate', 
           p.id, p.currency, c.currency)::text
  FROM pms_payments p
  JOIN pms_contracts c ON c.id = p.contract_id
  WHERE p.currency != c.currency
    AND (p.exchange_rate IS NULL OR p.amount_in_contract_currency IS NULL)
    AND (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id);

  -- Issue 4: Schedule item and payment amounts don't match
  RETURN QUERY
  SELECT 
    'amount_mismatch'::text,
    p.id,
    psi.id,
    p.contract_id,
    psi.period_date,
    format('Schedule expects %s, accumulated=%s (diff=%s)', 
           psi.expected_amount, psi.accumulated_paid_amount, 
           psi.expected_amount - psi.accumulated_paid_amount)::text
  FROM pms_payment_schedule_items psi
  JOIN pms_payments p ON p.schedule_item_id = psi.id
  WHERE psi.status = 'paid'
    AND ABS(psi.expected_amount - psi.accumulated_paid_amount) > 0.01
    AND (p_tenant_id IS NULL OR psi.tenant_id = p_tenant_id);

END;
$$;

-- 4. Create auto-fix function for orphaned payments
CREATE OR REPLACE FUNCTION public.fix_orphaned_payment(p_payment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payment RECORD;
  v_submission RECORD;
  v_schedule_item RECORD;
  v_result jsonb;
BEGIN
  -- Get payment
  SELECT * INTO v_payment FROM pms_payments WHERE id = p_payment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Payment not found');
  END IF;
  
  -- Check if already linked
  IF v_payment.schedule_item_id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_linked', 'schedule_item_id', v_payment.schedule_item_id);
  END IF;
  
  -- Try to find matching submission
  SELECT * INTO v_submission 
  FROM pms_payment_submissions 
  WHERE contract_id = v_payment.contract_id
    AND paid_date = v_payment.paid_date
    AND status = 'approved'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF FOUND AND v_submission.schedule_item_id IS NOT NULL THEN
    -- Get schedule item
    SELECT * INTO v_schedule_item 
    FROM pms_payment_schedule_items 
    WHERE id = v_submission.schedule_item_id;
    
    -- Update payment with submission data
    UPDATE pms_payments
    SET schedule_item_id = v_submission.schedule_item_id,
        contract_currency = COALESCE(v_submission.contract_currency, v_payment.contract_currency),
        exchange_rate = COALESCE(v_submission.exchange_rate, v_payment.exchange_rate),
        amount_in_contract_currency = COALESCE(v_submission.amount_in_contract_currency, v_payment.amount_in_contract_currency),
        updated_at = NOW()
    WHERE id = p_payment_id;
    
    -- Update schedule item with payment_id
    UPDATE pms_payment_schedule_items
    SET payment_id = p_payment_id,
        updated_at = NOW()
    WHERE id = v_submission.schedule_item_id
      AND payment_id IS NULL;
    
    RETURN jsonb_build_object(
      'status', 'fixed',
      'schedule_item_id', v_submission.schedule_item_id,
      'exchange_rate', v_submission.exchange_rate,
      'amount_in_contract_currency', v_submission.amount_in_contract_currency
    );
  END IF;
  
  RETURN jsonb_build_object('error', 'No matching submission found');
END;
$$;
