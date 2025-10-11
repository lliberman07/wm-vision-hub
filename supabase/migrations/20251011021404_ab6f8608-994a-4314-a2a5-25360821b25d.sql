-- Agregar PROVEEDOR al enum pms_app_role si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'PROVEEDOR' 
    AND enumtypid = 'pms_app_role'::regtype
  ) THEN
    ALTER TYPE pms_app_role ADD VALUE 'PROVEEDOR';
  END IF;
END $$;