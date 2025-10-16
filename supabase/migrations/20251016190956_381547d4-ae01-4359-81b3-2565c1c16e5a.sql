-- Agregar campos a pms_tenants_renters para soportar personas y empresas
ALTER TABLE pms_tenants_renters 
ADD COLUMN IF NOT EXISTS tenant_type TEXT CHECK (tenant_type IN ('persona', 'empresa')) DEFAULT 'persona',
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS mobile_phone TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Agregar comentarios
COMMENT ON COLUMN pms_tenants_renters.tenant_type IS 'Tipo de inquilino: persona o empresa';
COMMENT ON COLUMN pms_tenants_renters.first_name IS 'Nombre(s) del inquilino persona física';
COMMENT ON COLUMN pms_tenants_renters.last_name IS 'Apellido(s) del inquilino persona física';
COMMENT ON COLUMN pms_tenants_renters.mobile_phone IS 'Número de teléfono celular';
COMMENT ON COLUMN pms_tenants_renters.company_name IS 'Razón social de la empresa';
COMMENT ON COLUMN pms_tenants_renters.contact_name IS 'Nombre del contacto en la empresa';
COMMENT ON COLUMN pms_tenants_renters.tax_id IS 'CUIT de la empresa';
COMMENT ON COLUMN pms_tenants_renters.address IS 'Dirección';
COMMENT ON COLUMN pms_tenants_renters.city IS 'Ciudad';
COMMENT ON COLUMN pms_tenants_renters.state IS 'Provincia';
COMMENT ON COLUMN pms_tenants_renters.postal_code IS 'Código postal';