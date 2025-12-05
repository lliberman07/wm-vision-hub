-- Update existing subscription_invoices with NULL billing periods
-- Set billing_period_start and billing_period_end from the associated subscription's current period
UPDATE subscription_invoices si
SET 
  billing_period_start = COALESCE(si.billing_period_start, ts.current_period_start),
  billing_period_end = COALESCE(si.billing_period_end, ts.current_period_end)
FROM tenant_subscriptions ts
WHERE si.subscription_id = ts.id
  AND (si.billing_period_start IS NULL OR si.billing_period_end IS NULL);

-- For invoices without subscription link, use issue_date + billing cycle duration
UPDATE subscription_invoices si
SET 
  billing_period_start = COALESCE(si.billing_period_start, si.issue_date),
  billing_period_end = COALESCE(
    si.billing_period_end, 
    CASE 
      WHEN ts.billing_cycle = 'yearly' THEN si.issue_date + INTERVAL '1 year'
      ELSE si.issue_date + INTERVAL '1 month'
    END
  )
FROM tenant_subscriptions ts
WHERE si.subscription_id = ts.id
  AND (si.billing_period_start IS NULL OR si.billing_period_end IS NULL);