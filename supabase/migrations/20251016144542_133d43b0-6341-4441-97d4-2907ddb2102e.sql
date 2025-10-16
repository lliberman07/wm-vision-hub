-- Create RLS policy for users to view their own tenant
CREATE POLICY "Users can view their own tenant"
ON pms_tenants
FOR SELECT
TO public
USING (
  id IN (
    SELECT tenant_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND module = 'PMS'
      AND status = 'approved'
  )
);