-- Drop existing policies that depend on is_client_admin function
DROP POLICY IF EXISTS "Client admins can view users in their tenant" ON pms_client_users;
DROP POLICY IF EXISTS "Client admins can manage CLIENT_ADMIN users in their tenant" ON pms_client_users;

-- Now drop the function
DROP FUNCTION IF EXISTS is_client_admin(uuid, uuid);

-- Recreate function with correct signature
CREATE OR REPLACE FUNCTION is_client_admin(user_uuid uuid, tenant_uuid uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pms_client_users
    WHERE user_id = user_uuid
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
      AND (tenant_uuid IS NULL OR tenant_id = tenant_uuid)
  );
$$;

-- Recreate the dropped policies with updated function
CREATE POLICY "Client admins can view users in their tenant"
ON pms_client_users
FOR SELECT
USING (is_client_admin(auth.uid(), tenant_id));

CREATE POLICY "Client admins can manage CLIENT_ADMIN users in their tenant"
ON pms_client_users
FOR ALL
USING (is_client_admin(auth.uid(), tenant_id) AND user_type = 'CLIENT_ADMIN');

-- Add RLS policy for CLIENT_ADMIN to view their tenant in pms_tenants
DROP POLICY IF EXISTS "CLIENT_ADMIN can view their tenant" ON pms_tenants;
CREATE POLICY "CLIENT_ADMIN can view their tenant"
ON pms_tenants
FOR SELECT
USING (
  id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);

-- Add RLS policy for CLIENT_ADMIN to view subscription plans
DROP POLICY IF EXISTS "CLIENT_ADMIN can view subscription plans" ON subscription_plans;
CREATE POLICY "CLIENT_ADMIN can view subscription plans"
ON subscription_plans
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM pms_client_users
    WHERE user_id = auth.uid()
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);

-- Add RLS policy for CLIENT_ADMIN to view their tenant subscriptions
DROP POLICY IF EXISTS "CLIENT_ADMIN can view their tenant subscriptions" ON tenant_subscriptions;
CREATE POLICY "CLIENT_ADMIN can view their tenant subscriptions"
ON tenant_subscriptions
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);

-- Add RLS policies for CLIENT_ADMIN to view data needed for dashboard statistics
DROP POLICY IF EXISTS "CLIENT_ADMIN can view owners in their tenant" ON pms_owners;
CREATE POLICY "CLIENT_ADMIN can view owners in their tenant"
ON pms_owners
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);

DROP POLICY IF EXISTS "CLIENT_ADMIN can view properties in their tenant" ON pms_properties;
CREATE POLICY "CLIENT_ADMIN can view properties in their tenant"
ON pms_properties
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);

DROP POLICY IF EXISTS "CLIENT_ADMIN can view contracts in their tenant" ON pms_contracts;
CREATE POLICY "CLIENT_ADMIN can view contracts in their tenant"
ON pms_contracts
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);

DROP POLICY IF EXISTS "CLIENT_ADMIN can view payment schedule in their tenant" ON pms_payment_schedule_items;
CREATE POLICY "CLIENT_ADMIN can view payment schedule in their tenant"
ON pms_payment_schedule_items
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);

-- Add policy for tenants renters table
DROP POLICY IF EXISTS "CLIENT_ADMIN can view tenants renters in their tenant" ON pms_tenants_renters;
CREATE POLICY "CLIENT_ADMIN can view tenants renters in their tenant"
ON pms_tenants_renters
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);