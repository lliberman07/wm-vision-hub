-- ============================================
-- TENANTS ANALYTICS FUNCTIONS
-- Funciones RPC para análisis detallado de tenants
-- ============================================

-- FUNCIÓN 1: KPIs Generales del Sistema
CREATE OR REPLACE FUNCTION get_tenants_kpis()
RETURNS TABLE (
  total_inmobiliarias BIGINT,
  total_administradores BIGINT,
  total_propietarios_tenants BIGINT,
  total_propietarios_individuales BIGINT,
  total_properties BIGINT,
  total_inquilinos BIGINT,
  shared_properties BIGINT,
  full_ownership_properties BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      COUNT(DISTINCT CASE WHEN role::text = 'ADMINISTRADOR' THEN user_id END) AS total_administradores,
      COUNT(DISTINCT CASE WHEN role::text = 'PROPIETARIO' THEN user_id END) AS total_propietarios_individuales,
      COUNT(DISTINCT CASE WHEN role::text = 'INQUILINO' THEN user_id END) AS total_inquilinos
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

-- FUNCIÓN 2: Distribución de Roles por Tenant
CREATE OR REPLACE FUNCTION get_role_distribution_by_tenant()
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_type pms_tenant_type,
  max_users TEXT,
  inmobiliarias BIGINT,
  administradores BIGINT,
  propietarios BIGINT,
  inquilinos BIGINT,
  proveedores BIGINT,
  total_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id AS tenant_id,
    pt.name AS tenant_name,
    pt.tenant_type,
    pt.settings->'limits'->>'max_users' AS max_users,
    COUNT(DISTINCT CASE WHEN ur.role::text = 'INMOBILIARIA' THEN ur.user_id END) AS inmobiliarias,
    COUNT(DISTINCT CASE WHEN ur.role::text = 'ADMINISTRADOR' THEN ur.user_id END) AS administradores,
    COUNT(DISTINCT CASE WHEN ur.role::text = 'PROPIETARIO' THEN ur.user_id END) AS propietarios,
    COUNT(DISTINCT CASE WHEN ur.role::text = 'INQUILINO' THEN ur.user_id END) AS inquilinos,
    COUNT(DISTINCT CASE WHEN ur.role::text = 'PROVEEDOR' THEN ur.user_id END) AS proveedores,
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

-- FUNCIÓN 3: Análisis de Propiedades por Tenant
CREATE OR REPLACE FUNCTION get_property_analysis_by_tenant()
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  total_properties BIGINT,
  full_ownership_properties BIGINT,
  shared_properties BIGINT,
  unique_owners BIGINT,
  avg_ownership_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id AS tenant_id,
    pt.name AS tenant_name,
    COUNT(DISTINCT pp.id) AS total_properties,
    COUNT(DISTINCT CASE 
      WHEN op.share_percent = 100 THEN pp.id 
    END) AS full_ownership_properties,
    COUNT(DISTINCT CASE 
      WHEN op.share_percent < 100 THEN pp.id 
    END) AS shared_properties,
    COUNT(DISTINCT op.owner_id) AS unique_owners,
    ROUND(AVG(op.share_percent), 2) AS avg_ownership_percentage
  FROM pms_tenants pt
  LEFT JOIN pms_properties pp ON pp.tenant_id = pt.id
  LEFT JOIN pms_owner_properties op ON op.property_id = pp.id 
    AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
  WHERE pt.is_active = true
  GROUP BY pt.id, pt.name
  ORDER BY total_properties DESC;
END;
$$;

-- FUNCIÓN 4: Actividad Contractual por Tenant
CREATE OR REPLACE FUNCTION get_contract_activity_by_tenant()
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  active_contracts BIGINT,
  expired_contracts BIGINT,
  cancelled_contracts BIGINT,
  renewal_contracts BIGINT,
  active_tenants BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id AS tenant_id,
    pt.name AS tenant_name,
    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) AS active_contracts,
    COUNT(DISTINCT CASE WHEN c.status = 'expired' THEN c.id END) AS expired_contracts,
    COUNT(DISTINCT CASE WHEN c.status = 'cancelled' THEN c.id END) AS cancelled_contracts,
    COUNT(DISTINCT CASE WHEN c.is_renewal = true THEN c.id END) AS renewal_contracts,
    COUNT(DISTINCT CASE 
      WHEN c.status = 'active' 
        AND c.start_date <= CURRENT_DATE 
        AND c.end_date >= CURRENT_DATE 
      THEN c.tenant_renter_id 
    END) AS active_tenants
  FROM pms_tenants pt
  LEFT JOIN pms_contracts c ON c.tenant_id = pt.id
  WHERE pt.is_active = true
  GROUP BY pt.id, pt.name
  ORDER BY active_contracts DESC;
END;
$$;

-- FUNCIÓN 5: Crecimiento de Tenants en el Tiempo (últimos 12 meses)
CREATE OR REPLACE FUNCTION get_tenant_growth_over_time()
RETURNS TABLE (
  month TEXT,
  tenant_type pms_tenant_type,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
    pms_tenants.tenant_type,
    COUNT(*) AS count
  FROM pms_tenants
  WHERE created_at >= NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', created_at), pms_tenants.tenant_type
  ORDER BY month DESC;
END;
$$;

-- GRANT EXECUTE a authenticated
GRANT EXECUTE ON FUNCTION get_tenants_kpis() TO authenticated;
GRANT EXECUTE ON FUNCTION get_role_distribution_by_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_analysis_by_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION get_contract_activity_by_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_growth_over_time() TO authenticated;