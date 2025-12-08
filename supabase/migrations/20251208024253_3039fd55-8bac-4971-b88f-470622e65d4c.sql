-- Add RLS policies for CLIENT_ADMIN users across PMS tables

-- 1. pms_payments - Allow CLIENT_ADMIN to view payments
CREATE POLICY "CLIENT_ADMIN can view payments in their tenant"
  ON pms_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_payments.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );

-- 2. pms_expenses - Allow CLIENT_ADMIN to manage expenses
CREATE POLICY "CLIENT_ADMIN can manage expenses in their tenant"
  ON pms_expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_expenses.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );

-- 3. pms_contract_adjustments - Allow CLIENT_ADMIN to view adjustments
CREATE POLICY "CLIENT_ADMIN can view adjustments in their tenant"
  ON pms_contract_adjustments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_contract_adjustments.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );

-- 4. pms_maintenance_requests - Allow CLIENT_ADMIN to manage maintenance
CREATE POLICY "CLIENT_ADMIN can manage maintenance in their tenant"
  ON pms_maintenance_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_maintenance_requests.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );

-- 5. pms_documents - Allow CLIENT_ADMIN to manage documents
CREATE POLICY "CLIENT_ADMIN can manage documents in their tenant"
  ON pms_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_documents.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );

-- 6. pms_payment_receipts - Allow CLIENT_ADMIN to manage receipts
CREATE POLICY "CLIENT_ADMIN can manage receipts in their tenant"
  ON pms_payment_receipts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_payment_receipts.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );

-- 7. pms_contract_current - Allow CLIENT_ADMIN to view current amounts
CREATE POLICY "CLIENT_ADMIN can view current amounts in their tenant"
  ON pms_contract_current FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_contract_current.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );

-- 8. pms_cashflow_property - Allow CLIENT_ADMIN to view cashflow
CREATE POLICY "CLIENT_ADMIN can view cashflow in their tenant"
  ON pms_cashflow_property FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_cashflow_property.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );

-- 9. pms_payment_distributions - Allow CLIENT_ADMIN to view distributions
CREATE POLICY "CLIENT_ADMIN can view distributions in their tenant"
  ON pms_payment_distributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_payment_distributions.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );

-- 10. pms_contract_payment_methods - Allow CLIENT_ADMIN to manage payment methods
CREATE POLICY "CLIENT_ADMIN can manage payment methods in their tenant"
  ON pms_contract_payment_methods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pms_client_users cu
      WHERE cu.user_id = auth.uid()
        AND cu.tenant_id = pms_contract_payment_methods.tenant_id
        AND cu.user_type = 'CLIENT_ADMIN'::pms_client_user_type
        AND cu.is_active = true
    )
  );