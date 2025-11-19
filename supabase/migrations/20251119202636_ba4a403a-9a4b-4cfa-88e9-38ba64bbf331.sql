-- FASE 1: Sistema de Estados de Propiedad (Simplificado)

-- Paso 1: Limpiar y preparar
ALTER TABLE pms_properties DROP CONSTRAINT IF EXISTS pms_properties_status_check;
ALTER TABLE pms_properties ALTER COLUMN status DROP DEFAULT;

-- Paso 2: Crear enum
DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('inactive', 'active', 'rented', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Paso 3: Normalizar todos los valores disponibles a active
UPDATE pms_properties SET status = 'active' WHERE status = 'available';

-- Paso 4: Convertir columna
ALTER TABLE pms_properties 
ALTER COLUMN status TYPE property_status 
USING CASE 
  WHEN status IN ('active', 'rented', 'maintenance', 'inactive') THEN status::property_status
  ELSE 'active'::property_status
END;

ALTER TABLE pms_properties ALTER COLUMN status SET DEFAULT 'active'::property_status;
ALTER TABLE pms_properties ALTER COLUMN status SET NOT NULL;

-- Paso 5: Crear índices
CREATE INDEX IF NOT EXISTS idx_pms_properties_status ON pms_properties(status);
CREATE INDEX IF NOT EXISTS idx_pms_properties_tenant_status ON pms_properties(tenant_id, status);