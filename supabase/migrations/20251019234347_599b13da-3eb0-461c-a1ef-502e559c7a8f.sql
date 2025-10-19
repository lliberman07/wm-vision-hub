-- ===================================================================
-- RPC FUNCTION: get_user_pms_role
-- ===================================================================
-- Obtiene el rol PMS y tenant del usuario actual en tiempo real
-- SECURITY DEFINER permite ejecutar con permisos elevados sin exponer datos

CREATE OR REPLACE FUNCTION public.get_user_pms_role(_user_id uuid)
RETURNS TABLE (
  role text,
  tenant_id uuid,
  tenant_name text,
  tenant_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.role::text,
    ur.tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug
  FROM user_roles ur
  JOIN pms_tenants t ON t.id = ur.tenant_id
  WHERE ur.user_id = _user_id
    AND ur.module = 'PMS'
    AND ur.status = 'approved'
  ORDER BY 
    CASE 
      WHEN ur.role::text = 'SUPERADMIN' THEN 1
      WHEN ur.role::text = 'INMOBILIARIA' THEN 2
      WHEN ur.role::text = 'ADMINISTRADOR' THEN 3
      WHEN ur.role::text = 'PROPIETARIO' THEN 4
      WHEN ur.role::text = 'INQUILINO' THEN 5
      ELSE 6
    END;
$$;