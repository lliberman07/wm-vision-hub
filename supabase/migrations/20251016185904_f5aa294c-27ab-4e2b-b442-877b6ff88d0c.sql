-- Primero, agregar los nuevos campos
ALTER TABLE pms_owners 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS mobile_phone TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Eliminar el check constraint existente para owner_type
ALTER TABLE pms_owners DROP CONSTRAINT IF EXISTS pms_owners_owner_type_check;

-- Actualizar los valores existentes
UPDATE pms_owners 
SET owner_type = 'persona' 
WHERE owner_type = 'individual';

UPDATE pms_owners 
SET owner_type = 'empresa' 
WHERE owner_type = 'company';

-- Crear nuevo check constraint con los valores correctos
ALTER TABLE pms_owners 
ADD CONSTRAINT pms_owners_owner_type_check 
CHECK (owner_type IN ('persona', 'empresa'));

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN pms_owners.first_name IS 'Nombre(s) del propietario persona física';
COMMENT ON COLUMN pms_owners.last_name IS 'Apellido(s) del propietario persona física';
COMMENT ON COLUMN pms_owners.mobile_phone IS 'Número de teléfono celular';
COMMENT ON COLUMN pms_owners.company_name IS 'Razón social de la empresa';
COMMENT ON COLUMN pms_owners.state IS 'Provincia (para empresas)';
COMMENT ON COLUMN pms_owners.postal_code IS 'Código postal';