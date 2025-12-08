-- Recreate RLS policy on pms_contract_monthly_projections with correct enum values
CREATE POLICY "Staff can manage projections"
  ON pms_contract_monthly_projections
  FOR ALL
  TO public
  USING (
    has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) 
    OR has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) 
    OR has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
    OR EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_contract_monthly_projections.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );