-- Políticas RLS para permitir a PROPIETARIO gestionar propietarios (pms_owners)

-- Policy: PROPIETARIO puede ver propietarios de su tenant
CREATE POLICY "PROPIETARIO can view owners of tenant"
ON pms_owners FOR SELECT
TO authenticated
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);

-- Policy: PROPIETARIO puede crear propietarios en su tenant
CREATE POLICY "PROPIETARIO can create owners"
ON pms_owners FOR INSERT
TO authenticated
WITH CHECK (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);

-- Policy: PROPIETARIO puede actualizar propietarios de su tenant
CREATE POLICY "PROPIETARIO can update owners"
ON pms_owners FOR UPDATE
TO authenticated
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);

-- Policy: PROPIETARIO puede eliminar propietarios de su tenant
CREATE POLICY "PROPIETARIO can delete owners"
ON pms_owners FOR DELETE
TO authenticated
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);

-- Políticas RLS para permitir a PROPIETARIO gestionar inquilinos (pms_tenants_renters)

-- Policy: PROPIETARIO puede ver inquilinos de su tenant
CREATE POLICY "PROPIETARIO can view tenants"
ON pms_tenants_renters FOR SELECT
TO authenticated
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);

-- Policy: PROPIETARIO puede crear inquilinos en su tenant
CREATE POLICY "PROPIETARIO can create tenants"
ON pms_tenants_renters FOR INSERT
TO authenticated
WITH CHECK (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);

-- Policy: PROPIETARIO puede actualizar inquilinos de su tenant
CREATE POLICY "PROPIETARIO can update tenants"
ON pms_tenants_renters FOR UPDATE
TO authenticated
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);

-- Policy: PROPIETARIO puede eliminar inquilinos de su tenant
CREATE POLICY "PROPIETARIO can delete tenants"
ON pms_tenants_renters FOR DELETE
TO authenticated
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);

-- Políticas RLS para permitir a PROPIETARIO asignar propietarios a propiedades (pms_owner_properties)

-- Policy: PROPIETARIO puede crear asignaciones de propietarios a propiedades
CREATE POLICY "PROPIETARIO can assign owners to properties"
ON pms_owner_properties FOR INSERT
TO authenticated
WITH CHECK (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);

-- Policy: PROPIETARIO puede actualizar asignaciones de propietarios
CREATE POLICY "PROPIETARIO can update owner assignments"
ON pms_owner_properties FOR UPDATE
TO authenticated
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);

-- Policy: PROPIETARIO puede eliminar asignaciones de propietarios
CREATE POLICY "PROPIETARIO can delete owner assignments"
ON pms_owner_properties FOR DELETE
TO authenticated
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
);