-- Crear versión sobrecargada de has_pms_role que use nueva arquitectura
-- Esta versión acepta text y redirige a user_roles
CREATE OR REPLACE FUNCTION public.has_pms_role(
  _user_id uuid, 
  _role text,
  _tenant_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = lower(_role)
      AND module = 'PMS'
      AND status = 'approved'
      AND (_tenant_id IS NULL OR tenant_id = _tenant_id)
  )
$$;

-- Actualizar la versión con enum para que use la versión text
CREATE OR REPLACE FUNCTION public.has_pms_role(
  _user_id uuid, 
  _role pms_app_role,
  _tenant_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_pms_role(_user_id, _role::text, _tenant_id)
$$;