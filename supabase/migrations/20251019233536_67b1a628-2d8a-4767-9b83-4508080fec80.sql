-- ===================================================================
-- POLÍTICAS RLS PARA TABLAS PMS SIN POLÍTICAS
-- ===================================================================
-- Agrega políticas SOLO a las 3 tablas PMS que están bloqueadas
-- (users ya tiene políticas, se omite)

-- ===================================================================
-- 1. PMS_TENANTS - Tenant organizations
-- ===================================================================
CREATE POLICY "SUPERADMIN can manage all tenants"
ON pms_tenants
FOR ALL
USING (has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role));

CREATE POLICY "INMOBILIARIA can view their own tenant"
ON pms_tenants
FOR SELECT
USING (
  id IN (
    SELECT tenant_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND module = 'PMS'
      AND status = 'approved'
  )
);

CREATE POLICY "All PMS users can view their tenant"
ON pms_tenants
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT tenant_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND module = 'PMS'
      AND status = 'approved'
  )
);

-- ===================================================================
-- 2. PMS_TENANTS_RENTERS - Tenant/Renter profiles
-- ===================================================================
CREATE POLICY "Staff can manage all tenants_renters in their tenant"
ON pms_tenants_renters
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR 
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR 
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);

CREATE POLICY "Users can view their own tenant_renter profile"
ON pms_tenants_renters
FOR SELECT
USING (
  user_id = auth.uid() OR
  tenant_id IN (
    SELECT tenant_id 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND module = 'PMS'
      AND status = 'approved'
  )
);

CREATE POLICY "Users can update their own tenant_renter profile"
ON pms_tenants_renters
FOR UPDATE
USING (user_id = auth.uid());

-- ===================================================================
-- 3. PMS_PROPERTIES - Properties
-- ===================================================================
CREATE POLICY "Staff can manage all properties in their tenant"
ON pms_properties
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR 
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR 
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);

CREATE POLICY "PROPIETARIO can view properties they own"
ON pms_properties
FOR SELECT
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id) AND (
    -- Properties where user is owner
    id IN (
      SELECT DISTINCT op.property_id
      FROM pms_owner_properties op
      JOIN pms_owners o ON o.id = op.owner_id
      WHERE o.user_id = auth.uid()
        AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
    )
    -- OR properties in their propietario tenant
    OR tenant_id IN (
      SELECT ur.tenant_id
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

CREATE POLICY "INQUILINO can view properties with active contracts"
ON pms_properties
FOR SELECT
USING (
  has_pms_role(auth.uid(), 'INQUILINO'::pms_app_role, tenant_id) AND
  id IN (
    SELECT c.property_id
    FROM pms_contracts c
    JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
    WHERE tr.user_id = auth.uid()
      AND c.status = 'active'
      AND c.start_date <= CURRENT_DATE
      AND c.end_date >= CURRENT_DATE
  )
);