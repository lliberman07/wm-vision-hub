-- Add RLS policies for CLIENT_ADMIN to view and manage their subscription invoices

-- Policy for CLIENT_ADMIN to view their tenant's invoices
CREATE POLICY "Client admins can view their tenant invoices"
ON subscription_invoices
FOR SELECT
USING (is_client_admin(auth.uid(), tenant_id));

-- Policy for CLIENT_ADMIN to update invoices (for uploading payment proof)
CREATE POLICY "Client admins can update their tenant invoices"
ON subscription_invoices
FOR UPDATE
USING (is_client_admin(auth.uid(), tenant_id))
WITH CHECK (is_client_admin(auth.uid(), tenant_id));