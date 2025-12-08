-- Add currency conversion columns to pms_payment_submissions
ALTER TABLE pms_payment_submissions 
ADD COLUMN IF NOT EXISTS payment_currency TEXT,
ADD COLUMN IF NOT EXISTS contract_currency TEXT,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC,
ADD COLUMN IF NOT EXISTS amount_in_contract_currency NUMERIC;