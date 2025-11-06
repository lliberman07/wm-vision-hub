-- FASE 1: Sistema de Sucursales para PMS
-- 1. Agregar columna parent_tenant_id para jerarquía
ALTER TABLE pms_tenants
ADD COLUMN parent_tenant_id UUID REFERENCES pms_tenants(id) ON DELETE SET NULL;

-- 2. Crear índice para búsquedas jerárquicas eficientes
CREATE INDEX idx_pms_tenants_parent_tenant_id ON pms_tenants(parent_tenant_id);

-- 3. Agregar constraint: solo inmobiliarias y administradores pueden tener sucursales
ALTER TABLE pms_tenants
ADD CONSTRAINT check_tenant_hierarchy CHECK (
  parent_tenant_id IS NULL OR 
  tenant_type IN ('inmobiliaria', 'administrador')
);

-- 4. Agregar constraint: máximo 2 niveles de jerarquía (no sub-sucursales)
CREATE OR REPLACE FUNCTION validate_tenant_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Si tiene parent_tenant_id, verificar que el padre no tenga parent_tenant_id
  IF NEW.parent_tenant_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM pms_tenants 
      WHERE id = NEW.parent_tenant_id 
      AND parent_tenant_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'No se permiten más de 2 niveles de jerarquía (sub-sucursales)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_tenant_hierarchy
BEFORE INSERT OR UPDATE ON pms_tenants
FOR EACH ROW
EXECUTE FUNCTION validate_tenant_hierarchy();

-- 5. Estandarizar settings JSON con estructura definida
-- Actualizar settings existentes con estructura estándar
UPDATE pms_tenants
SET settings = jsonb_build_object(
  'limits', jsonb_build_object(
    'max_users', COALESCE((settings->'limits'->>'max_users')::integer, 
      CASE tenant_type
        WHEN 'sistema' THEN 20
        WHEN 'inmobiliaria' THEN 2
        WHEN 'propietario' THEN 2
        WHEN 'inquilino' THEN 2
        WHEN 'administrador' THEN 2
        WHEN 'proveedor_servicios' THEN 1
        ELSE 2
      END
    ),
    'max_properties', COALESCE((settings->'limits'->>'max_properties')::integer, 
      CASE tenant_type
        WHEN 'sistema' THEN 999999
        WHEN 'inmobiliaria' THEN 100
        WHEN 'propietario' THEN 10
        WHEN 'administrador' THEN 50
        ELSE 10
      END
    ),
    'max_contracts', COALESCE((settings->'limits'->>'max_contracts')::integer, 
      CASE tenant_type
        WHEN 'sistema' THEN 999999
        WHEN 'inmobiliaria' THEN 100
        WHEN 'propietario' THEN 10
        WHEN 'administrador' THEN 50
        ELSE 10
      END
    )
  ),
  'features', jsonb_build_object(
    'enable_reports', COALESCE((settings->'features'->>'enable_reports')::boolean, true),
    'enable_analytics', COALESCE((settings->'features'->>'enable_analytics')::boolean, 
      tenant_type IN ('sistema', 'inmobiliaria', 'administrador')
    ),
    'enable_branches', COALESCE((settings->'features'->>'enable_branches')::boolean, 
      tenant_type IN ('inmobiliaria', 'administrador')
    ),
    'enable_api_access', COALESCE((settings->'features'->>'enable_api_access')::boolean, false)
  ),
  'branding', jsonb_build_object(
    'logo_url', COALESCE(settings->'branding'->>'logo_url', NULL),
    'primary_color', COALESCE(settings->'branding'->>'primary_color', '#1e40af'),
    'company_name', COALESCE(settings->'branding'->>'company_name', name)
  ),
  'is_headquarters', COALESCE((settings->>'is_headquarters')::boolean, false)
)
WHERE settings IS NULL OR NOT (settings ? 'limits' AND settings ? 'features' AND settings ? 'branding');

-- 6. Función para obtener jerarquía completa de un tenant con estadísticas
CREATE OR REPLACE FUNCTION get_tenant_hierarchy(p_tenant_id UUID)
RETURNS TABLE(
  tenant_id UUID,
  tenant_name TEXT,
  tenant_slug TEXT,
  tenant_type pms_tenant_type,
  parent_tenant_id UUID,
  is_headquarters BOOLEAN,
  level INTEGER,
  total_users BIGINT,
  total_properties BIGINT,
  total_active_contracts BIGINT,
  total_expired_contracts BIGINT,
  total_revenue_current_month NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE tenant_tree AS (
    -- Caso base: tenant raíz
    SELECT 
      t.id,
      t.name,
      t.slug,
      t.tenant_type,
      t.parent_tenant_id,
      COALESCE((t.settings->>'is_headquarters')::boolean, false) as is_hq,
      1 as lvl
    FROM pms_tenants t
    WHERE t.id = p_tenant_id
    
    UNION ALL
    
    -- Caso recursivo: sucursales
    SELECT 
      t.id,
      t.name,
      t.slug,
      t.tenant_type,
      t.parent_tenant_id,
      COALESCE((t.settings->>'is_headquarters')::boolean, false) as is_hq,
      tt.lvl + 1
    FROM pms_tenants t
    INNER JOIN tenant_tree tt ON t.parent_tenant_id = tt.id
  )
  SELECT 
    tt.id,
    tt.name,
    tt.slug,
    tt.tenant_type,
    tt.parent_tenant_id,
    tt.is_hq,
    tt.lvl,
    COUNT(DISTINCT ur.user_id) FILTER (WHERE ur.status = 'approved') as total_users,
    COUNT(DISTINCT p.id) as total_properties,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as total_active_contracts,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'expired') as total_expired_contracts,
    COALESCE(SUM(pay.paid_amount) FILTER (
      WHERE pay.status = 'paid' 
      AND DATE_TRUNC('month', pay.paid_date) = DATE_TRUNC('month', CURRENT_DATE)
    ), 0) as total_revenue_current_month
  FROM tenant_tree tt
  LEFT JOIN user_roles ur ON ur.tenant_id = tt.id AND ur.module = 'PMS'
  LEFT JOIN pms_properties p ON p.tenant_id = tt.id
  LEFT JOIN pms_contracts c ON c.tenant_id = tt.id
  LEFT JOIN pms_payments pay ON pay.tenant_id = tt.id
  GROUP BY tt.id, tt.name, tt.slug, tt.tenant_type, tt.parent_tenant_id, tt.is_hq, tt.lvl
  ORDER BY tt.lvl, tt.name;
END;
$$;

-- 7. Función auxiliar para verificar acceso jerárquico
CREATE OR REPLACE FUNCTION has_hierarchical_access(
  p_user_id UUID,
  p_target_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tenant_id UUID;
  target_parent_id UUID;
BEGIN
  -- Obtener tenant_id del usuario
  SELECT tenant_id INTO user_tenant_id
  FROM user_roles
  WHERE user_id = p_user_id
    AND module = 'PMS'
    AND status = 'approved'
    AND role::text IN ('INMOBILIARIA', 'ADMINISTRADOR')
  LIMIT 1;
  
  -- Si no tiene rol, denegar
  IF user_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Si es el mismo tenant, permitir
  IF user_tenant_id = p_target_tenant_id THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar si el target_tenant es sucursal del user_tenant
  SELECT parent_tenant_id INTO target_parent_id
  FROM pms_tenants
  WHERE id = p_target_tenant_id;
  
  -- Si el tenant del usuario es padre del target, permitir
  IF target_parent_id = user_tenant_id THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 8. Actualizar RLS policies para respeto jerárquico
-- Política para pms_properties: Casa Matriz puede ver propiedades de sucursales
DROP POLICY IF EXISTS "INMOBILIARIA and ADMINISTRADOR can manage properties" ON pms_properties;
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage properties hierarchical"
ON pms_properties
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id) OR
  has_hierarchical_access(auth.uid(), tenant_id)
);

-- Política para pms_contracts: Casa Matriz puede ver contratos de sucursales
DROP POLICY IF EXISTS "INMOBILIARIA and ADMINISTRADOR can manage contracts" ON pms_contracts;
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage contracts hierarchical"
ON pms_contracts
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id) OR
  has_hierarchical_access(auth.uid(), tenant_id)
);

-- Política para pms_owners: Casa Matriz puede ver owners de sucursales
DROP POLICY IF EXISTS "INMOBILIARIA and ADMINISTRADOR can manage owners" ON pms_owners;
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage owners hierarchical"
ON pms_owners
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id) OR
  has_hierarchical_access(auth.uid(), tenant_id)
);

-- Política para pms_tenants_renters: Casa Matriz puede ver inquilinos de sucursales
DROP POLICY IF EXISTS "INMOBILIARIA and ADMINISTRADOR can manage renters" ON pms_tenants_renters;
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage renters hierarchical"
ON pms_tenants_renters
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id) OR
  has_hierarchical_access(auth.uid(), tenant_id)
);

-- Política para pms_payments: Casa Matriz puede ver pagos de sucursales
DROP POLICY IF EXISTS "Staff can manage all payments" ON pms_payments;
CREATE POLICY "Staff can manage all payments hierarchical"
ON pms_payments
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id) OR
  has_hierarchical_access(auth.uid(), tenant_id)
);

-- Política para pms_expenses: Casa Matriz puede ver gastos de sucursales
DROP POLICY IF EXISTS "Staff can manage all expenses" ON pms_expenses;
CREATE POLICY "Staff can manage all expenses hierarchical"
ON pms_expenses
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id) OR
  has_hierarchical_access(auth.uid(), tenant_id)
);

-- Política para pms_tenants: usuarios pueden ver su tenant y sus sucursales
DROP POLICY IF EXISTS "Users can view their own tenant" ON pms_tenants;
CREATE POLICY "Users can view tenant hierarchy"
ON pms_tenants
FOR SELECT
USING (
  is_superadmin_pms() OR
  id IN (
    SELECT tenant_id FROM user_roles
    WHERE user_id = auth.uid() AND module = 'PMS' AND status = 'approved'
  ) OR
  parent_tenant_id IN (
    SELECT tenant_id FROM user_roles
    WHERE user_id = auth.uid() 
    AND module = 'PMS' 
    AND status = 'approved'
    AND role::text IN ('INMOBILIARIA', 'ADMINISTRADOR')
  )
);

-- 9. Comentarios para documentación
COMMENT ON COLUMN pms_tenants.parent_tenant_id IS 'ID del tenant padre (Casa Matriz). NULL para tenants independientes.';
COMMENT ON FUNCTION get_tenant_hierarchy IS 'Retorna jerarquía completa de un tenant con estadísticas agregadas (usuarios, propiedades, contratos, ingresos).';
COMMENT ON FUNCTION has_hierarchical_access IS 'Verifica si un usuario tiene acceso jerárquico a un tenant (ej: Casa Matriz accede a sucursales).';