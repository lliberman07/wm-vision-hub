-- Add RLS policies for Granada Admins to manage subscription requests

-- Policy for tenant_subscriptions: Granada admins can view all subscriptions
CREATE POLICY "Granada admins can view all subscriptions"
ON tenant_subscriptions
FOR SELECT
TO authenticated
USING (is_granada_admin(auth.uid()));

-- Policy for pms_tenants: Granada admins can view all tenants
CREATE POLICY "Granada admins can view all tenants"
ON pms_tenants
FOR SELECT
TO authenticated
USING (is_granada_admin(auth.uid()));

-- Policy for subscription_change_requests: Granada admins can manage change requests
CREATE POLICY "Granada admins can view change requests"
ON subscription_change_requests
FOR SELECT
TO authenticated
USING (is_granada_admin(auth.uid()));

CREATE POLICY "Granada admins can update change requests"
ON subscription_change_requests
FOR UPDATE
TO authenticated
USING (is_granada_admin(auth.uid()));

CREATE POLICY "Granada admins can insert change requests"
ON subscription_change_requests
FOR INSERT
TO authenticated
WITH CHECK (is_granada_admin(auth.uid()));

CREATE POLICY "Granada admins can delete change requests"
ON subscription_change_requests
FOR DELETE
TO authenticated
USING (is_granada_admin(auth.uid()));