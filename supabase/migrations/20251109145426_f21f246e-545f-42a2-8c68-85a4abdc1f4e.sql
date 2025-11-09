-- Eliminar función existente para recrearla con nuevos campos
DROP FUNCTION IF EXISTS get_tenants_with_user_count();

-- Crear función para contar usuarios que afectan el límite del tenant
-- Lógica diferenciada por tenant_type:
-- - tenant_type 'propietario': cuenta propietario + admin
-- - tenant_type 'inmobiliaria'/'administrador'/'sistema': cuenta inmobiliaria + admin
-- - inquilino nunca cuenta para el límite

CREATE OR REPLACE FUNCTION get_tenant_admin_user_count(tenant_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_type pms_tenant_type;
  v_count integer;
BEGIN
  -- Obtener tipo de tenant
  SELECT tenant_type INTO v_tenant_type
  FROM pms_tenants
  WHERE id = tenant_id_param;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Contar según tipo de tenant
  IF v_tenant_type = 'propietario' THEN
    -- Tenant PROPIETARIO: contar propietario + admin
    SELECT COUNT(DISTINCT ur.user_id)::integer INTO v_count
    FROM user_roles ur
    WHERE ur.tenant_id = tenant_id_param
      AND ur.module = 'PMS'
      AND ur.status = 'approved'
      AND ur.role::text IN ('propietario', 'admin');
      
  ELSIF v_tenant_type IN ('inmobiliaria', 'administrador', 'sistema') THEN
    -- Tenant INMOBILIARIA/ADMINISTRADOR/SISTEMA: contar inmobiliaria + admin
    SELECT COUNT(DISTINCT ur.user_id)::integer INTO v_count
    FROM user_roles ur
    WHERE ur.tenant_id = tenant_id_param
      AND ur.module = 'PMS'
      AND ur.status = 'approved'
      AND ur.role::text IN ('inmobiliaria', 'admin');
      
  ELSE
    -- Otros tipos: contar todos excepto inquilino
    SELECT COUNT(DISTINCT ur.user_id)::integer INTO v_count
    FROM user_roles ur
    WHERE ur.tenant_id = tenant_id_param
      AND ur.module = 'PMS'
      AND ur.status = 'approved'
      AND ur.role::text != 'inquilino';
  END IF;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Recrear función get_tenants_with_user_count con conteos diferenciados
CREATE OR REPLACE FUNCTION get_tenants_with_user_count()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  tenant_type pms_tenant_type,
  is_active boolean,
  created_at timestamptz,
  settings jsonb,
  user_count bigint,
  max_users integer,
  admin_user_count bigint,
  owner_user_count bigint,
  tenant_user_count bigint
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.tenant_type,
    t.is_active,
    t.created_at,
    t.settings,
    
    -- Total de usuarios (para información general)
    COUNT(DISTINCT ur.user_id) FILTER (WHERE ur.status = 'approved') as user_count,
    
    -- Límite de usuarios
    COALESCE(
      (t.settings->'limits'->>'max_users')::integer,
      CASE t.tenant_type
        WHEN 'sistema' THEN 20
        WHEN 'inmobiliaria' THEN 2
        WHEN 'propietario' THEN 2
        WHEN 'administrador' THEN 2
        ELSE 2
      END
    ) as max_users,
    
    -- USUARIOS ADMINISTRATIVOS que cuentan para límite (depende de tenant_type)
    CASE 
      WHEN t.tenant_type = 'propietario' THEN
        COUNT(DISTINCT ur.user_id) FILTER (
          WHERE ur.status = 'approved' 
          AND ur.role::text IN ('propietario', 'admin')
        )
      WHEN t.tenant_type IN ('inmobiliaria', 'administrador', 'sistema') THEN
        COUNT(DISTINCT ur.user_id) FILTER (
          WHERE ur.status = 'approved' 
          AND ur.role::text IN ('inmobiliaria', 'admin')
        )
      ELSE
        COUNT(DISTINCT ur.user_id) FILTER (
          WHERE ur.status = 'approved' 
          AND ur.role::text != 'inquilino'
        )
    END as admin_user_count,
    
    -- USUARIOS PROPIETARIOS (informativo)
    COUNT(DISTINCT ur.user_id) FILTER (
      WHERE ur.status = 'approved' 
      AND ur.role::text = 'propietario'
    ) as owner_user_count,
    
    -- USUARIOS INQUILINOS (informativo, nunca cuentan para límite)
    COUNT(DISTINCT ur.user_id) FILTER (
      WHERE ur.status = 'approved' 
      AND ur.role::text = 'inquilino'
    ) as tenant_user_count
    
  FROM pms_tenants t
  LEFT JOIN user_roles ur ON ur.tenant_id = t.id 
    AND ur.module = 'PMS'
  GROUP BY t.id, t.name, t.slug, t.tenant_type, t.is_active, t.created_at, t.settings
  ORDER BY t.created_at DESC;
$$;

COMMENT ON FUNCTION get_tenant_admin_user_count(uuid) IS 
'Cuenta usuarios que afectan límite de suscripción según tenant_type: propietario+admin para tenant tipo propietario, inmobiliaria+admin para inmobiliaria/administrador/sistema. inquilino nunca cuenta.';
