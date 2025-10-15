-- Agregar nuevo valor 'sistema' al enum pms_tenant_type
ALTER TYPE public.pms_tenant_type ADD VALUE IF NOT EXISTS 'sistema';