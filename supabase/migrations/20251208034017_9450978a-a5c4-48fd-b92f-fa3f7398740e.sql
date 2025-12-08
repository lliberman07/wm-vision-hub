-- Fix infinite recursion in is_superadmin_pms() function
-- Adding SECURITY DEFINER to bypass RLS when checking superadmin status

CREATE OR REPLACE FUNCTION public.is_superadmin_pms()
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
    WHERE ur.user_id = auth.uid()
      AND ur.module = 'PMS'
      AND ur.role::text = 'SUPERADMIN'
      AND t.tenant_type = 'sistema'
      AND ur.status = 'approved'
  );
$$;