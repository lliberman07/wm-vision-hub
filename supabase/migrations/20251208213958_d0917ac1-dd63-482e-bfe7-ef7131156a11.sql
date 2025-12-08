-- Agregar política RLS para que INQUILINO pueda ver las proyecciones de su contrato
CREATE POLICY "INQUILINO can view their contract projections"
ON pms_contract_monthly_projections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pms_client_users cu
    WHERE cu.user_id = auth.uid()
    AND cu.user_type = 'INQUILINO'
    AND cu.contract_id = pms_contract_monthly_projections.contract_id
    AND cu.is_active = true
  )
);