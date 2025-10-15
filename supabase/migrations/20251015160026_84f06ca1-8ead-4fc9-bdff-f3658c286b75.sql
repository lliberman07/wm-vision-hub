-- Crear políticas RLS para pms_cashflow_property

-- Permitir lectura a SUPERADMIN, INMOBILIARIA y ADMINISTRADOR
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can view cashflow"
ON pms_cashflow_property
FOR SELECT
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);

-- Permitir a PROPIETARIO ver cashflow de sus propiedades
CREATE POLICY "PROPIETARIO can view cashflow of own properties"
ON pms_cashflow_property
FOR SELECT
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id) AND
  (
    property_id IN (
      SELECT DISTINCT op.property_id
      FROM pms_owner_properties op
      JOIN pms_owners o ON o.id = op.owner_id
      WHERE o.user_id = auth.uid()
        AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
    )
    OR
    tenant_id IN (
      SELECT DISTINCT ur.tenant_id
      FROM user_roles ur
      JOIN pms_tenants t ON t.id = ur.tenant_id
      WHERE ur.user_id = auth.uid()
        AND ur.module = 'PMS'
        AND ur.role::text = 'PROPIETARIO'
        AND ur.status = 'approved'
        AND t.tenant_type = 'propietario'
    )
  )
);

-- Permitir a los staff gestionar cashflow (los triggers lo necesitan)
CREATE POLICY "Staff can manage cashflow"
ON pms_cashflow_property
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);