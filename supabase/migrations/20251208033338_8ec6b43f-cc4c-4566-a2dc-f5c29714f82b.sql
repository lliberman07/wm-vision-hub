-- First, add a unique constraint on (user_id, tenant_id) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pms_client_users_user_id_tenant_id_key'
  ) THEN
    ALTER TABLE pms_client_users 
    ADD CONSTRAINT pms_client_users_user_id_tenant_id_key UNIQUE (user_id, tenant_id);
  END IF;
END $$;

-- Fix existing data: Create pms_client_users entry for propietarios with their own tenants
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
  SPLIT_PART(COALESCE(u.raw_user_meta_data->>'full_name', u.email), ' ', 1) as first_name,
  COALESCE(NULLIF(SPLIT_PART(COALESCE(u.raw_user_meta_data->>'full_name', ''), ' ', 2), ''), 'Usuario') as last_name,
  'PROPIETARIO' as user_type,
  true as is_active
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
JOIN pms_tenants t ON t.id = ur.tenant_id
WHERE ur.module = 'PMS'
  AND ur.role::text = 'PROPIETARIO'
  AND ur.status = 'approved'
  AND t.tenant_type = 'propietario'
  AND NOT EXISTS (
    SELECT 1 FROM pms_client_users pcu
    WHERE pcu.user_id = ur.user_id
      AND pcu.tenant_id = ur.tenant_id
  )
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- Also update RLS policy to allow PROPIETARIO with propietario tenant to manage users
DROP POLICY IF EXISTS "Propietario tenant owners can view users" ON pms_client_users;
CREATE POLICY "Propietario tenant owners can view users"
  ON pms_client_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pms_tenants t ON t.id = ur.tenant_id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = pms_client_users.tenant_id
        AND ur.module = 'PMS'
        AND ur.role::text = 'PROPIETARIO'
        AND ur.status = 'approved'
        AND t.tenant_type = 'propietario'
    )
  );

DROP POLICY IF EXISTS "Propietario tenant owners can manage users" ON pms_client_users;
CREATE POLICY "Propietario tenant owners can manage users"
  ON pms_client_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pms_tenants t ON t.id = ur.tenant_id
      WHERE ur.user_id = auth.uid()
        AND ur.tenant_id = pms_client_users.tenant_id
        AND ur.module = 'PMS'
        AND ur.role::text = 'PROPIETARIO'
        AND ur.status = 'approved'
        AND t.tenant_type = 'propietario'
    )
  );