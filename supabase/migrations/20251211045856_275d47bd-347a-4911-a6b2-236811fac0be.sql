-- Add contract tracking fields to tenant_subscriptions
ALTER TABLE tenant_subscriptions 
ADD COLUMN IF NOT EXISTS contract_start_date date,
ADD COLUMN IF NOT EXISTS contract_invoice_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS renewal_required boolean DEFAULT false;

-- Update existing subscriptions to set contract_start_date from created_at
UPDATE tenant_subscriptions 
SET contract_start_date = created_at::date 
WHERE contract_start_date IS NULL;

-- Create or replace the generate_renewal_invoices function with 12-invoice limit
CREATE OR REPLACE FUNCTION public.generate_renewal_invoices()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription RECORD;
  v_invoice_number text;
  v_new_period_start date;
  v_new_period_end date;
  v_created_count integer := 0;
  v_skipped_count integer := 0;
  v_renewal_marked_count integer := 0;
  v_existing_invoice_count integer;
  v_created_invoices jsonb := '[]'::jsonb;
BEGIN
  -- Process MONTHLY subscriptions only
  FOR v_subscription IN 
    SELECT ts.*, sp.name as plan_name, sp.price_monthly, sp.price_yearly, sp.currency,
           t.name as tenant_name, t.email as tenant_email
    FROM tenant_subscriptions ts
    JOIN subscription_plans sp ON sp.id = ts.plan_id
    JOIN pms_tenants t ON t.id = ts.tenant_id
    WHERE ts.billing_cycle = 'monthly'  -- Only monthly subscriptions
      AND ts.status IN ('trial', 'active')
      AND ts.cancel_at_period_end = false
      AND ts.renewal_required = false  -- Not already marked for renewal
      AND ts.current_period_end = CURRENT_DATE + 7  -- 7 days before period end
  LOOP
    BEGIN
      -- Count existing invoices for this subscription
      SELECT COUNT(*) INTO v_existing_invoice_count
      FROM subscription_invoices
      WHERE subscription_id = v_subscription.id;
      
      -- If already has 12 invoices, mark for renewal instead of creating new invoice
      IF v_existing_invoice_count >= 12 THEN
        UPDATE tenant_subscriptions
        SET renewal_required = true,
            updated_at = NOW()
        WHERE id = v_subscription.id;
        
        v_renewal_marked_count := v_renewal_marked_count + 1;
        CONTINUE; -- Skip to next subscription
      END IF;
      
      -- Check if invoice already exists for next period
      v_new_period_start := v_subscription.current_period_end + 1;
      
      IF EXISTS (
        SELECT 1 FROM subscription_invoices si
        WHERE si.subscription_id = v_subscription.id
          AND si.billing_period_start = v_new_period_start
      ) THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;
      
      -- Calculate new period (monthly = 30 days)
      v_new_period_end := v_new_period_start + 29;
      
      -- Generate invoice number
      v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
        UPPER(SUBSTRING(MD5(v_subscription.id::text || NOW()::text), 1, 8));
      
      -- Create invoice
      INSERT INTO subscription_invoices (
        subscription_id,
        tenant_id,
        invoice_number,
        invoice_type,
        amount,
        currency,
        status,
        issue_date,
        due_date,
        billing_period_start,
        billing_period_end,
        notes
      ) VALUES (
        v_subscription.id,
        v_subscription.tenant_id,
        v_invoice_number,
        'subscription',
        v_subscription.price_monthly,
        v_subscription.currency,
        'pending',
        CURRENT_DATE,
        v_new_period_start,
        v_new_period_start,
        v_new_period_end,
        format('Factura %s de 12 - Plan %s (Mensual)', 
          v_existing_invoice_count + 1,
          v_subscription.plan_name
        )
      );
      
      -- Update subscription invoice count
      UPDATE tenant_subscriptions
      SET contract_invoice_count = v_existing_invoice_count + 1,
          updated_at = NOW()
      WHERE id = v_subscription.id;
      
      -- Add to created invoices array for email notification
      v_created_invoices := v_created_invoices || jsonb_build_object(
        'invoice_number', v_invoice_number,
        'tenant_name', v_subscription.tenant_name,
        'tenant_email', v_subscription.tenant_email,
        'amount', v_subscription.price_monthly,
        'currency', v_subscription.currency,
        'due_date', v_new_period_start,
        'billing_period_start', v_new_period_start,
        'billing_period_end', v_new_period_end,
        'invoice_count', v_existing_invoice_count + 1,
        'is_last_invoice', (v_existing_invoice_count + 1 = 12)
      );
      
      v_created_count := v_created_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_skipped_count := v_skipped_count + 1;
      RAISE WARNING 'Error creating invoice for subscription %: %', v_subscription.id, SQLERRM;
    END;
  END LOOP;
  
  -- Also check for YEARLY subscriptions approaching renewal
  UPDATE tenant_subscriptions ts
  SET renewal_required = true,
      updated_at = NOW()
  FROM subscription_plans sp
  WHERE ts.plan_id = sp.id
    AND ts.billing_cycle = 'yearly'
    AND ts.status IN ('trial', 'active')
    AND ts.cancel_at_period_end = false
    AND ts.renewal_required = false
    AND ts.current_period_end <= CURRENT_DATE + 30;  -- 30 days before year end
  
  RETURN jsonb_build_object(
    'created', v_created_count,
    'skipped', v_skipped_count,
    'renewal_marked', v_renewal_marked_count,
    'created_invoices', v_created_invoices,
    'execution_date', CURRENT_DATE
  );
END;
$function$;