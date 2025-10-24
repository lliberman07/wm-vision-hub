-- Corregir función get_role_distribution_by_tenant para comparar roles correctamente
DROP FUNCTION IF EXISTS public.get_role_distribution_by_tenant();

CREATE OR REPLACE FUNCTION public.get_role_distribution_by_tenant()
RETURNS TABLE(
  tenant_id uuid,
  tenant_name text,
  tenant_type pms_tenant_type,
  max_users text,
  inmobiliarias bigint,
  administradores bigint,
  propietarios bigint,
  inquilinos bigint,
  proveedores bigint,
  total_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id AS tenant_id,
    pt.name AS tenant_name,
    pt.tenant_type,
    pt.settings->'limits'->>'max_users' AS max_users,
    COUNT(DISTINCT CASE WHEN LOWER(ur.role::text) = 'inmobiliaria' THEN ur.user_id END) AS inmobiliarias,
    COUNT(DISTINCT CASE WHEN LOWER(ur.role::text) = 'administrador' THEN ur.user_id END) AS administradores,
    COUNT(DISTINCT CASE WHEN LOWER(ur.role::text) = 'propietario' THEN ur.user_id END) AS propietarios,
    COUNT(DISTINCT CASE WHEN LOWER(ur.role::text) = 'inquilino' THEN ur.user_id END) AS inquilinos,
    COUNT(DISTINCT CASE WHEN LOWER(ur.role::text) IN ('proveedor', 'proveedor_servicios') THEN ur.user_id END) AS proveedores,
    COUNT(DISTINCT ur.user_id) AS total_users
  FROM pms_tenants pt
  LEFT JOIN user_roles ur ON ur.tenant_id = pt.id 
    AND ur.module = 'PMS' 
    AND ur.status = 'approved'
  WHERE pt.is_active = true
  GROUP BY pt.id, pt.name, pt.tenant_type, pt.settings
  ORDER BY pt.tenant_type, pt.name;
END;
$$;