-- Eliminar función existente y recrear con nuevo tipo de retorno
DROP FUNCTION IF EXISTS public.get_current_user_profile();

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(role user_role_type, status request_status)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role, ur.status
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.module = 'WM'
    AND ur.role IN ('admin', 'superadmin')
  LIMIT 1;
$$;