-- Update RLS policy for tenant_subscriptions to include PROPIETARIO and GESTOR roles
DROP POLICY IF EXISTS "Users can view own tenant subscription" ON tenant_subscriptions;

CREATE POLICY "Users can view own tenant subscription" 
ON tenant_subscriptions FOR SELECT
USING (
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR 
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id) OR 
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'GESTOR'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role)
);