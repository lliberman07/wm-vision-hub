-- Insert the missing pms_client_users entry for the propietario tenant
-- The role is stored as 'propietario' (lowercase) in user_roles

INSERT INTO pms_client_users (
  user_id, 
  tenant_id, 
  email, 
  first_name, 
  last_name, 
  user_type, 
  is_active
)
SELECT 
  ur.user_id,
  ur.tenant_id,
  u.email,
  COALESCE(SPLIT_PART(u.raw_user_meta_data->>'full_name', ' ', 1), 'Usuario') as first_name,
  COALESCE(NULLIF(SPLIT_PART(u.raw_user_meta_data->>'full_name', ' ', 2), ''), 'Propietario') as last_name,
  'PROPIETARIO' as user_type,
  true as is_active
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
JOIN pms_tenants t ON t.id = ur.tenant_id
WHERE ur.module = 'PMS'
  AND UPPER(ur.role::text) = 'PROPIETARIO'
  AND ur.status = 'approved'
  AND t.tenant_type = 'propietario'
ON CONFLICT (user_id, tenant_id) DO NOTHING;