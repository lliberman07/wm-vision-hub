-- Crear enum para tipos de tenant PMS
CREATE TYPE public.pms_tenant_type AS ENUM (
  'inmobiliaria',
  'administrador',
  'propietario',
  'inquilino',
  'proveedor_servicios'
);

-- Agregar columna tenant_type a pms_tenants
ALTER TABLE public.pms_tenants 
ADD COLUMN tenant_type public.pms_tenant_type NOT NULL DEFAULT 'inmobiliaria';

-- Crear índice para mejorar consultas por tipo
CREATE INDEX idx_pms_tenants_tenant_type ON public.pms_tenants(tenant_type);