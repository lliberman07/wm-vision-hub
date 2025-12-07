-- Agregar políticas RLS para CLIENT_ADMIN en pms_tenants_renters

-- Política INSERT: CLIENT_ADMIN puede crear inquilinos en su tenant
CREATE POLICY "CLIENT_ADMIN can create tenants renters in their tenant"
ON public.pms_tenants_renters
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

-- Política UPDATE: CLIENT_ADMIN puede editar inquilinos en su tenant
CREATE POLICY "CLIENT_ADMIN can update tenants renters in their tenant"
ON public.pms_tenants_renters
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
);

-- Política DELETE: CLIENT_ADMIN puede eliminar inquilinos en su tenant
CREATE POLICY "CLIENT_ADMIN can delete tenants renters in their tenant"
ON public.pms_tenants_renters
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