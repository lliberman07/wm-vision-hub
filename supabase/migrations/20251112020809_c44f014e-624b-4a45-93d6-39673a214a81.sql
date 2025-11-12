-- Add currency column to pms_properties table for rent amount
ALTER TABLE pms_properties 
ADD COLUMN IF NOT EXISTS alquiler_moneda text DEFAULT 'ARS' CHECK (alquiler_moneda IN ('ARS', 'USD'));