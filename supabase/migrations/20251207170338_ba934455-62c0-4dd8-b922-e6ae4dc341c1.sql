-- Add policy to allow CLIENT_ADMIN to update their own tenant's settings
CREATE POLICY "CLIENT_ADMIN can update their tenant settings" 
ON public.pms_tenants 
FOR UPDATE 
USING (
  id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
    AND user_type = 'CLIENT_ADMIN' 
    AND is_active = true
  )
)
WITH CHECK (
  id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
    AND user_type = 'CLIENT_ADMIN' 
    AND is_active = true
  )
);