-- Add separate address fields to pms_properties
ALTER TABLE pms_properties
ADD COLUMN IF NOT EXISTS street_name TEXT,
ADD COLUMN IF NOT EXISTS street_number TEXT,
ADD COLUMN IF NOT EXISTS floor TEXT,
ADD COLUMN IF NOT EXISTS apartment TEXT;

-- Add comment for documentation
COMMENT ON COLUMN pms_properties.street_name IS 'Nombre de la calle o avenida';
COMMENT ON COLUMN pms_properties.street_number IS 'Número de la propiedad';
COMMENT ON COLUMN pms_properties.floor IS 'Número de piso';
COMMENT ON COLUMN pms_properties.apartment IS 'Número o letra de departamento';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_pms_properties_street_name ON pms_properties(street_name);
CREATE INDEX IF NOT EXISTS idx_pms_properties_street_number ON pms_properties(street_number);