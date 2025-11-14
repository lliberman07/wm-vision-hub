
-- Insertar rol CLIENT_ADMIN para leolibman@gmail.com en tenant WM
-- Primero obtenemos el user_id y tenant_id

INSERT INTO pms_client_users (
  user_id,
  tenant_id,
  email,
  first_name,
  last_name,
  user_type,
  is_active,
  created_by
)
SELECT 
  u.id as user_id,
  t.id as tenant_id,
  'leolibman@gmail.com' as email,
  'Leo' as first_name,
  'Libman' as last_name,
  'CLIENT_ADMIN' as user_type,
  true as is_active,
  u.id as created_by
FROM auth.users u
CROSS JOIN pms_tenants t
WHERE u.email = 'leolibman@gmail.com'
  AND t.name = 'WM Property Management'
ON CONFLICT (user_id, tenant_id, user_type) 
DO UPDATE SET is_active = true;
