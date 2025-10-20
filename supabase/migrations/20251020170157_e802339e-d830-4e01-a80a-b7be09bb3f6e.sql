-- Función para obtener el límite de usuarios de un tenant
CREATE OR REPLACE FUNCTION get_tenant_user_limit(tenant_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (settings->'limits'->>'max_users')::integer,
    CASE tenant_type
      WHEN 'sistema' THEN 20
      WHEN 'inmobiliaria' THEN 10
      WHEN 'propietario' THEN 2
      WHEN 'inquilino' THEN 2
      WHEN 'administrador' THEN 5
      WHEN 'proveedor_servicios' THEN 3
      ELSE 2
    END
  )
  FROM pms_tenants
  WHERE id = tenant_id_param;
$$;

-- Función para obtener tenants con conteo de usuarios y límite
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
  max_users integer
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
    COUNT(DISTINCT ur.user_id) FILTER (WHERE ur.status = 'approved') as user_count,
    COALESCE(
      (t.settings->'limits'->>'max_users')::integer,
      CASE t.tenant_type
        WHEN 'sistema' THEN 20
        WHEN 'inmobiliaria' THEN 10
        WHEN 'propietario' THEN 2
        WHEN 'inquilino' THEN 2
        WHEN 'administrador' THEN 5
        WHEN 'proveedor_servicios' THEN 3
        ELSE 2
      END
    ) as max_users
  FROM pms_tenants t
  LEFT JOIN user_roles ur ON ur.tenant_id = t.id 
    AND ur.module = 'PMS'
  GROUP BY t.id, t.name, t.slug, t.tenant_type, t.is_active, t.created_at, t.settings
  ORDER BY t.created_at DESC;
$$;

-- Actualizar todos los tenants existentes con límites por defecto en settings
UPDATE pms_tenants
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{limits}',
  jsonb_build_object(
    'max_users', 
    CASE tenant_type
      WHEN 'sistema' THEN 20
      WHEN 'inmobiliaria' THEN 10
      WHEN 'propietario' THEN 2
      WHEN 'inquilino' THEN 2
      WHEN 'administrador' THEN 5
      WHEN 'proveedor_servicios' THEN 3
      ELSE 2
    END
  )
)
WHERE settings->'limits'->'max_users' IS NULL;

-- Asegurar que WM tenga 20 usuarios
UPDATE pms_tenants
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{limits,max_users}',
  '20'
)
WHERE slug = 'wm-default';