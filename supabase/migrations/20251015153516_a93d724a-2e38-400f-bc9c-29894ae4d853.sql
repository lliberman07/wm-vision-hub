-- ============================================
-- FIX: Eliminar recursión infinita en pms_contracts y pms_expenses
-- ============================================

-- 1. CORREGIR pms_contracts
DROP POLICY IF EXISTS "PROPIETARIO can view contracts of own properties" ON pms_contracts;

CREATE POLICY "PROPIETARIO can view contracts of own properties v2"
ON pms_contracts FOR SELECT
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND (
    -- Caso 1: Propietario de la propiedad del contrato
    property_id IN (
      SELECT DISTINCT op.property_id
      FROM pms_owner_properties op
      INNER JOIN pms_owners o ON o.id = op.owner_id
      WHERE o.user_id = auth.uid()
        AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
    )
    OR
    -- Caso 2: Propietario como tenant (ve todos los contratos de su tenant)
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

-- 2. CORREGIR pms_expenses
DROP POLICY IF EXISTS "PROPIETARIO can view expenses of own properties" ON pms_expenses;

CREATE POLICY "PROPIETARIO can view expenses of own properties v2"
ON pms_expenses FOR SELECT
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND (
    -- Caso 1: Gastos de propiedades donde es propietario
    property_id IN (
      SELECT DISTINCT op.property_id
      FROM pms_owner_properties op
      INNER JOIN pms_owners o ON o.id = op.owner_id
      WHERE o.user_id = auth.uid()
    )
    OR
    -- Caso 2: Propietario como tenant (ve todos los gastos de su tenant)
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