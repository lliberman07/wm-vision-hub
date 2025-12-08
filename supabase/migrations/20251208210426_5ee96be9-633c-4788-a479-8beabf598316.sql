-- Fix has_pms_role function for case-insensitive role comparison
-- This affects ALL existing and future INQUILINO users globally

CREATE OR REPLACE FUNCTION public.has_pms_role(_user_id uuid, _role text, _tenant_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND lower(role::text) = lower(_role)
      AND module = 'PMS'
      AND status = 'approved'
      AND (_tenant_id IS NULL OR tenant_id = _tenant_id)
  )
$$;

-- Also fix the overloaded version that takes pms_app_role
CREATE OR REPLACE FUNCTION public.has_pms_role(_user_id uuid, _role pms_app_role, _tenant_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT has_pms_role(_user_id, _role::text, _tenant_id)
$$;