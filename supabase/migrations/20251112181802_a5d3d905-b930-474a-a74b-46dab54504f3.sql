-- Fix v_current_user_tenants to include pms_client_users
-- This allows CLIENT_ADMIN and other client users to be recognized by PMSContext

DROP VIEW IF EXISTS v_current_user_tenants;

CREATE OR REPLACE VIEW v_current_user_tenants AS
-- Union of user_roles (old system) and pms_client_users (new system)
SELECT
  user_id,
  tenant_id,
  slug,
  name,
  type,
  roles
FROM (
  -- Part 1: user_roles (existing system)
  SELECT
    ur.user_id,
    ur.tenant_id,
    t.slug,
    t.name,
    t.tenant_type as type,
    array_agg(DISTINCT ur.role::text ORDER BY ur.role::text) as roles
  FROM user_roles ur
  JOIN pms_tenants t ON t.id = ur.tenant_id
  WHERE ur.status = 'approved'
  GROUP BY ur.user_id, ur.tenant_id, t.slug, t.name, t.tenant_type
  
  UNION ALL
  
  -- Part 2: pms_client_users (new system)
  -- Map CLIENT_ADMIN to INMOBILIARIA role for PMS context
  SELECT
    pcu.user_id,
    pcu.tenant_id,
    t.slug,
    t.name,
    t.tenant_type as type,
    array_agg(DISTINCT 
      CASE 
        WHEN pcu.user_type::text = 'CLIENT_ADMIN' THEN 'INMOBILIARIA'
        ELSE pcu.user_type::text
      END 
      ORDER BY 
      CASE 
        WHEN pcu.user_type::text = 'CLIENT_ADMIN' THEN 'INMOBILIARIA'
        ELSE pcu.user_type::text
      END
    ) as roles
  FROM pms_client_users pcu
  JOIN pms_tenants t ON t.id = pcu.tenant_id
  WHERE pcu.is_active = true
  GROUP BY pcu.user_id, pcu.tenant_id, t.slug, t.name, t.tenant_type
) combined_roles;