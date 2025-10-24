-- Corregir función get_tenants_kpis para comparar roles correctamente
DROP FUNCTION IF EXISTS public.get_tenants_kpis();

CREATE OR REPLACE FUNCTION public.get_tenants_kpis()
RETURNS TABLE(
  total_inmobiliarias bigint,
  total_administradores bigint,
  total_propietarios_tenants bigint,
  total_propietarios_individuales bigint,
  total_properties bigint,
  total_inquilinos bigint,
  shared_properties bigint,
  full_ownership_properties bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH tenant_stats AS (
    SELECT 
      COUNT(DISTINCT CASE WHEN tenant_type = 'inmobiliaria' THEN id END) AS total_inmobiliarias,
      COUNT(DISTINCT CASE WHEN tenant_type = 'propietario' THEN id END) AS total_propietarios_tenants
    FROM pms_tenants
    WHERE is_active = true
  ),
  role_stats AS (
    SELECT
      COUNT(DISTINCT CASE WHEN LOWER(role::text) = 'administrador' THEN user_id END) AS total_administradores,
      COUNT(DISTINCT CASE WHEN LOWER(role::text) = 'propietario' THEN user_id END) AS total_propietarios_individuales,
      COUNT(DISTINCT CASE WHEN LOWER(role::text) = 'inquilino' THEN user_id END) AS total_inquilinos
    FROM user_roles
    WHERE module = 'PMS'
      AND status = 'approved'
  ),
  property_stats AS (
    SELECT COUNT(DISTINCT id) AS total_properties
    FROM pms_properties
  ),
  ownership_stats AS (
    SELECT 
      COUNT(DISTINCT CASE 
        WHEN share_percent < 100 THEN property_id 
      END) AS shared_properties,
      COUNT(DISTINCT CASE 
        WHEN share_percent = 100 THEN property_id 
      END) AS full_ownership_properties
    FROM pms_owner_properties
    WHERE end_date IS NULL OR end_date >= CURRENT_DATE
  )
  SELECT 
    ts.total_inmobiliarias,
    rs.total_administradores,
    ts.total_propietarios_tenants,
    rs.total_propietarios_individuales,
    ps.total_properties,
    rs.total_inquilinos,
    os.shared_properties,
    os.full_ownership_properties
  FROM tenant_stats ts
  CROSS JOIN role_stats rs
  CROSS JOIN property_stats ps
  CROSS JOIN ownership_stats os;
END;
$$;