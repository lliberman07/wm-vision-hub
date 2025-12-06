-- Política ALL para CLIENT_ADMIN en pms_owner_properties
CREATE POLICY "CLIENT_ADMIN can manage owner_properties in their tenant"
ON pms_owner_properties
FOR ALL
TO public
USING (
  tenant_id IN (
    SELECT tenant_id FROM pms_client_users
    WHERE user_id = auth.uid()
    AND user_type = 'CLIENT_ADMIN'
    AND is_active = true
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM pms_client_users
    WHERE user_id = auth.uid()
    AND user_type = 'CLIENT_ADMIN'
    AND is_active = true
  )
);