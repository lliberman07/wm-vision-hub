-- Add new columns to pms_access_requests table
ALTER TABLE pms_access_requests 
ADD COLUMN IF NOT EXISTS entity_type TEXT CHECK (entity_type IN ('fisica', 'juridica')),
ADD COLUMN IF NOT EXISTS razon_social TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS cuit_cuil TEXT,
ADD COLUMN IF NOT EXISTS contract_number TEXT;

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_pms_access_requests_entity_type ON pms_access_requests(entity_type);
CREATE INDEX IF NOT EXISTS idx_pms_access_requests_contract_number ON pms_access_requests(contract_number);

-- Add constraint to validate CUIT has exactly 11 digits for Persona Jurídica
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_cuit_juridica'
  ) THEN
    ALTER TABLE pms_access_requests 
    ADD CONSTRAINT check_cuit_juridica 
    CHECK (
      (entity_type != 'juridica') OR 
      (entity_type = 'juridica' AND tax_id IS NOT NULL AND length(regexp_replace(tax_id, '[^0-9]', '', 'g')) = 11)
    );
  END IF;
END $$;

-- Add constraint to validate CUIT/CUIL has exactly 11 digits for Persona Física
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_cuit_cuil_fisica'
  ) THEN
    ALTER TABLE pms_access_requests 
    ADD CONSTRAINT check_cuit_cuil_fisica 
    CHECK (
      (entity_type != 'fisica') OR 
      (entity_type = 'fisica' AND cuit_cuil IS NOT NULL AND length(regexp_replace(cuit_cuil, '[^0-9]', '', 'g')) = 11)
    );
  END IF;
END $$;