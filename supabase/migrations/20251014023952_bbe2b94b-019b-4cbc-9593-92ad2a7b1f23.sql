-- Add new columns to pms_contracts table for enhanced guarantee management
ALTER TABLE pms_contracts
ADD COLUMN deposit_currency TEXT DEFAULT 'ARS',
ADD COLUMN guarantee_type TEXT,
ADD COLUMN guarantee_details TEXT;