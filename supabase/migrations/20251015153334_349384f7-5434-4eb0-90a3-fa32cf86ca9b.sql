-- Eliminar políticas problemáticas con recursión infinita
DROP POLICY IF EXISTS "PROPIETARIO can view own properties" ON pms_properties;
DROP POLICY IF EXISTS "PROPIETARIO as tenant can create properties" ON pms_properties;
DROP POLICY IF EXISTS "PROPIETARIO as tenant can update properties" ON pms_properties;
DROP POLICY IF EXISTS "INQUILINO can view own rented property" ON pms_properties;

-- Recrear políticas SIN recursión usando funciones helper
-- Política para PROPIETARIO ver propiedades donde tiene participación
CREATE POLICY "PROPIETARIO can view own properties v2"
ON pms_properties FOR SELECT
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND (
    -- Caso 1: Es propietario de la propiedad (mediante pms_owner_properties)
    id IN (
      SELECT DISTINCT op.property_id
      FROM pms_owner_properties op
      INNER JOIN pms_owners o ON o.id = op.owner_id
      WHERE o.user_id = auth.uid()
        AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
    )
    OR
    -- Caso 2: Es PROPIETARIO como tenant (puede ver todas las propiedades de su tenant)
    tenant_id IN (
      SELECT DISTINCT ur.tenant_id
      FROM user_roles ur
      INNER JOIN pms_tenants t ON t.id = ur.tenant_id
      WHERE ur.user_id = auth.uid()
        AND ur.module = 'PMS'
        AND ur.role::text = 'PROPIETARIO'
        AND ur.status = 'approved'
        AND t.tenant_type = 'propietario'
    )
  )
);

-- Política para PROPIETARIO crear propiedades (solo como tenant)
CREATE POLICY "PROPIETARIO as tenant can create properties v2"
ON pms_properties FOR INSERT
WITH CHECK (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND tenant_id IN (
    SELECT DISTINCT ur.tenant_id
    FROM user_roles ur
    INNER JOIN pms_tenants t ON t.id = ur.tenant_id
    WHERE ur.user_id = auth.uid()
      AND ur.module = 'PMS'
      AND ur.role::text = 'PROPIETARIO'
      AND ur.status = 'approved'
      AND t.tenant_type = 'propietario'
  )
);

-- Política para PROPIETARIO editar propiedades de su tenant
CREATE POLICY "PROPIETARIO as tenant can update properties v2"
ON pms_properties FOR UPDATE
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND tenant_id IN (
    SELECT DISTINCT ur.tenant_id
    FROM user_roles ur
    INNER JOIN pms_tenants t ON t.id = ur.tenant_id
    WHERE ur.user_id = auth.uid()
      AND ur.module = 'PMS'
      AND ur.role::text = 'PROPIETARIO'
      AND ur.status = 'approved'
      AND t.tenant_type = 'propietario'
  )
);

-- Política para INQUILINO ver solo la propiedad que alquila
CREATE POLICY "INQUILINO can view own rented property v2"
ON pms_properties FOR SELECT
USING (
  has_pms_role(auth.uid(), 'INQUILINO'::pms_app_role, tenant_id)
  AND id IN (
    SELECT DISTINCT c.property_id
    FROM pms_contracts c
    INNER JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
    WHERE tr.user_id = auth.uid()
      AND c.status = 'active'
      AND c.start_date <= CURRENT_DATE
      AND c.end_date >= CURRENT_DATE
  )
);