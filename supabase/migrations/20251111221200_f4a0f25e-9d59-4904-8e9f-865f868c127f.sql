-- Add currency column to pms_expenses
ALTER TABLE pms_expenses 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ARS';

-- Update existing expenses with contract currency
UPDATE pms_expenses e
SET currency = COALESCE(
  (SELECT c.currency 
   FROM pms_contracts c 
   WHERE c.id = e.contract_id),
  'ARS'
)
WHERE e.currency IS NULL OR e.currency = 'ARS';

-- Add comment
COMMENT ON COLUMN pms_expenses.currency IS 'Currency in which the expense was actually paid (ARS or USD)';