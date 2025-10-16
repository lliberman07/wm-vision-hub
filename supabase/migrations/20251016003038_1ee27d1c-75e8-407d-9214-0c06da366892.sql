-- Agregar políticas RLS faltantes para pms_maintenance_requests

-- Política para INSERT: INMOBILIARIA y ADMINISTRADOR pueden crear solicitudes
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can create maintenance"
ON pms_maintenance_requests
FOR INSERT
TO authenticated
WITH CHECK (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);

-- Política para SELECT: INMOBILIARIA y ADMINISTRADOR pueden ver solicitudes
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can view maintenance"
ON pms_maintenance_requests
FOR SELECT
TO authenticated
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);

-- Política para DELETE: INMOBILIARIA y ADMINISTRADOR pueden eliminar solicitudes
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can delete maintenance"
ON pms_maintenance_requests
FOR DELETE
TO authenticated
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);