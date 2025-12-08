-- Fix infinite recursion in RLS policies for pms_tenants and pms_client_users
-- Create SECURITY DEFINER helper functions that bypass RLS

-- 1. Function to check if user has approved PMS role for a tenant
CREATE OR REPLACE FUNCTION public.user_has_pms_tenant_access(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND module = 'PMS'
      AND status = 'approved'
  );
$$;

-- 2. Function to get user's PMS tenant IDs
CREATE OR REPLACE FUNCTION public.get_user_pms_tenant_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT tenant_id
  FROM user_roles
  WHERE user_id = _user_id
    AND module = 'PMS'
    AND status = 'approved';
$$;

-- 3. Function to check if user is CLIENT_ADMIN for a tenant (without querying pms_tenants)
CREATE OR REPLACE FUNCTION public.is_client_admin_direct(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pms_client_users
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  );
$$;

-- 4. Function to check if user is PROPIETARIO owner of a tenant
CREATE OR REPLACE FUNCTION public.is_propietario_tenant_owner(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN pms_tenants t ON t.id = ur.tenant_id
    WHERE ur.user_id = _user_id
      AND ur.tenant_id = _tenant_id
      AND ur.module = 'PMS'
      AND ur.role::text = 'PROPIETARIO'
      AND ur.status = 'approved'
      AND t.tenant_type = 'propietario'
  );
$$;

-- Drop and recreate problematic policies on pms_tenants

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "CLIENT_ADMIN can view their tenant" ON pms_tenants;
DROP POLICY IF EXISTS "CLIENT_ADMIN can update their tenant settings" ON pms_tenants;
DROP POLICY IF EXISTS "All PMS users can view their tenant" ON pms_tenants;

-- Recreate with SECURITY DEFINER functions
CREATE POLICY "All PMS users can view their tenant"
ON pms_tenants
FOR SELECT
USING (id IN (SELECT get_user_pms_tenant_ids(auth.uid())));

CREATE POLICY "CLIENT_ADMIN can view their tenant"
ON pms_tenants
FOR SELECT
USING (is_client_admin_direct(auth.uid(), id));

CREATE POLICY "CLIENT_ADMIN can update their tenant settings"
ON pms_tenants
FOR UPDATE
USING (is_client_admin_direct(auth.uid(), id))
WITH CHECK (is_client_admin_direct(auth.uid(), id));

-- Drop and recreate problematic policies on pms_client_users

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Propietario tenant owners can view users" ON pms_client_users;
DROP POLICY IF EXISTS "Propietario tenant owners can manage users" ON pms_client_users;
DROP POLICY IF EXISTS "Client admins can view users in their tenant" ON pms_client_users;
DROP POLICY IF EXISTS "Client admins can manage CLIENT_ADMIN users in their tenant" ON pms_client_users;

-- Recreate with SECURITY DEFINER functions
CREATE POLICY "Propietario tenant owners can view users"
ON pms_client_users
FOR SELECT
USING (is_propietario_tenant_owner(auth.uid(), tenant_id));

CREATE POLICY "Propietario tenant owners can manage users"
ON pms_client_users
FOR ALL
USING (is_propietario_tenant_owner(auth.uid(), tenant_id));

CREATE POLICY "Client admins can view users in their tenant"
ON pms_client_users
FOR SELECT
USING (is_client_admin_direct(auth.uid(), tenant_id));

CREATE POLICY "Client admins can manage users in their tenant"
ON pms_client_users
FOR ALL
USING (is_client_admin_direct(auth.uid(), tenant_id));