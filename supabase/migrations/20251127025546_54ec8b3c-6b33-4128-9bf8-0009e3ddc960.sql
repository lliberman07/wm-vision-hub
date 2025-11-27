-- ============================================================================
-- SECURITY FIX: Remove auth.users exposure from v_roles_extended view
-- ============================================================================
-- Fecha: 2025-01-27
-- Descripción: Reemplazar el view v_roles_extended para que NO exponga
--              la tabla auth.users, usando solo la tabla users en su lugar.

-- Drop existing view
DROP VIEW IF EXISTS v_roles_extended;

-- Recreate view without auth.users exposure
CREATE OR REPLACE VIEW v_roles_extended AS
SELECT 
  ur.id,
  ur.user_id,
  u.email,
  ur.tenant_id,
  t.slug,
  t.name AS tenant_name,
  t.tenant_type,
  ur.role::text AS role_type,
  ur.created_at AS assigned_at
FROM user_roles ur
JOIN pms_tenants t ON t.id = ur.tenant_id
LEFT JOIN users u ON u.id = ur.user_id
WHERE ur.module = 'PMS'::module_type;

COMMENT ON VIEW v_roles_extended IS 'View of user roles without exposing auth.users table - uses only public.users';
