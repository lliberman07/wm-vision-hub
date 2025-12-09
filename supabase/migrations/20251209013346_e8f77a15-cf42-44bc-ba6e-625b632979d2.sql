-- =====================================================
-- FIX: Allow CLIENT_ADMIN to manage payments
-- This adds RLS policies for pms_client_users with CLIENT_ADMIN type
-- =====================================================

-- 1. Create helper function to check CLIENT_ADMIN status
CREATE OR REPLACE FUNCTION public.is_client_admin_for_tenant(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pms_client_users
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  );
$$;

-- 2. Add policy for CLIENT_ADMIN to INSERT payments
CREATE POLICY "CLIENT_ADMIN can insert payments in their tenant"
ON pms_payments
FOR INSERT
WITH CHECK (
  public.is_client_admin_for_tenant(auth.uid(), tenant_id)
);

-- 3. Add policy for CLIENT_ADMIN to UPDATE payments
CREATE POLICY "CLIENT_ADMIN can update payments in their tenant"
ON pms_payments
FOR UPDATE
USING (
  public.is_client_admin_for_tenant(auth.uid(), tenant_id)
)
WITH CHECK (
  public.is_client_admin_for_tenant(auth.uid(), tenant_id)
);

-- 4. Add policy for CLIENT_ADMIN to DELETE payments
CREATE POLICY "CLIENT_ADMIN can delete payments in their tenant"
ON pms_payments
FOR DELETE
USING (
  public.is_client_admin_for_tenant(auth.uid(), tenant_id)
);

-- 5. Add policy for CLIENT_ADMIN to UPDATE payment schedule items
CREATE POLICY "CLIENT_ADMIN can update schedule items in their tenant"
ON pms_payment_schedule_items
FOR UPDATE
USING (
  public.is_client_admin_for_tenant(auth.uid(), tenant_id)
)
WITH CHECK (
  public.is_client_admin_for_tenant(auth.uid(), tenant_id)
);