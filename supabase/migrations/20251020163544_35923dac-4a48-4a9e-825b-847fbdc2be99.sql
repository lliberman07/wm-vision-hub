-- Migración: Corregir tenant de Leo Liber (leo@nuchas.com)
-- Crear tenant personal para Leo como propietario

-- 1. Crear el tenant personal para Leo
INSERT INTO pms_tenants (name, slug, tenant_type, is_active, settings)
VALUES ('Leo Liber', 'prop-leo', 'propietario', true, '{}')
ON CONFLICT (slug) DO NOTHING;

-- 2. Actualizar el tenant_id del rol de Leo
-- Primero obtenemos el ID del nuevo tenant y el user_id de Leo
WITH leo_info AS (
  SELECT 
    u.id as user_id,
    t.id as new_tenant_id
  FROM auth.users u
  CROSS JOIN pms_tenants t
  WHERE u.email = 'leo@nuchas.com'
    AND t.slug = 'prop-leo'
)
UPDATE user_roles
SET tenant_id = (SELECT new_tenant_id FROM leo_info)
WHERE user_id = (SELECT user_id FROM leo_info)
  AND module = 'PMS'
  AND role = 'propietario';