-- Agregar campo admin_email a pms_tenants
ALTER TABLE pms_tenants 
ADD COLUMN admin_email TEXT;

-- Actualizar tenant por defecto
UPDATE pms_tenants 
SET admin_email = 'administracion@wmpms.com.ar' 
WHERE slug = 'wm-default';

-- Crear tabla pms_owner_report_logs para auditoría
CREATE TABLE pms_owner_report_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES pms_contracts(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES pms_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES pms_owners(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent_to TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  pdf_generated BOOLEAN DEFAULT false,
  pdf_url TEXT,
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_owner_report_logs_period ON pms_owner_report_logs(period);
CREATE INDEX idx_owner_report_logs_owner ON pms_owner_report_logs(owner_id);
CREATE INDEX idx_owner_report_logs_contract ON pms_owner_report_logs(contract_id);
CREATE INDEX idx_owner_report_logs_tenant ON pms_owner_report_logs(tenant_id);

-- Habilitar RLS
ALTER TABLE pms_owner_report_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Staff puede gestionar todos los logs
CREATE POLICY "Staff can manage all report logs"
  ON pms_owner_report_logs FOR ALL
  USING (
    has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
    has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
    has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
  );

-- Policy: Propietarios pueden ver sus propios logs
CREATE POLICY "Owners can view their own report logs"
  ON pms_owner_report_logs FOR SELECT
  USING (
    has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id) AND
    owner_id IN (
      SELECT id FROM pms_owners WHERE user_id = auth.uid()
    )
  );