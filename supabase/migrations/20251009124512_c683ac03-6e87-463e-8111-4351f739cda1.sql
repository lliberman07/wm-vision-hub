-- Create a security definer function to get the default tenant
-- This allows unauthenticated/new users to get the default tenant ID
CREATE OR REPLACE FUNCTION public.get_default_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.pms_tenants
  WHERE slug = 'wm-default'
  LIMIT 1;
$$;