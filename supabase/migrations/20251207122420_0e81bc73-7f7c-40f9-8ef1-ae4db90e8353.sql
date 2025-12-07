-- Agregar campo CUIT/CUIL a pms_tenants para inmobiliarias y administradores
ALTER TABLE pms_tenants ADD COLUMN IF NOT EXISTS cuit_cuil TEXT;

-- Comentario para documentar el campo
COMMENT ON COLUMN pms_tenants.cuit_cuil IS 'CUIT para empresas, CUIT/CUIL para personas físicas';