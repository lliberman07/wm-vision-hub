-- Agregar políticas RLS para CLIENT_ADMIN en pms_contracts

-- 1. Política INSERT para CLIENT_ADMIN
CREATE POLICY "CLIENT_ADMIN can insert contracts in their tenant"
ON pms_contracts
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT pms_client_users.tenant_id
    FROM pms_client_users
    WHERE pms_client_users.user_id = auth.uid()
      AND pms_client_users.user_type = 'CLIENT_ADMIN'
      AND pms_client_users.is_active = true
  )
);

-- 2. Política UPDATE para CLIENT_ADMIN
CREATE POLICY "CLIENT_ADMIN can update contracts in their tenant"
ON pms_contracts
FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT pms_client_users.tenant_id
    FROM pms_client_users
    WHERE pms_client_users.user_id = auth.uid()
      AND pms_client_users.user_type = 'CLIENT_ADMIN'
      AND pms_client_users.is_active = true
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT pms_client_users.tenant_id
    FROM pms_client_users
    WHERE pms_client_users.user_id = auth.uid()
      AND pms_client_users.user_type = 'CLIENT_ADMIN'
      AND pms_client_users.is_active = true
  )
);

-- 3. Política DELETE para CLIENT_ADMIN
CREATE POLICY "CLIENT_ADMIN can delete contracts in their tenant"
ON pms_contracts
FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT pms_client_users.tenant_id
    FROM pms_client_users
    WHERE pms_client_users.user_id = auth.uid()
      AND pms_client_users.user_type = 'CLIENT_ADMIN'
      AND pms_client_users.is_active = true
  )
);