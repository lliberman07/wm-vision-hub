-- =====================================================
-- FASE 1: Migración para Suscripciones Acumulativas
-- =====================================================

-- 1. Eliminar restricción UNIQUE en tenant_subscriptions.tenant_id
-- Primero identificamos y eliminamos la restricción existente
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar el nombre de la restricción UNIQUE en tenant_id
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'tenant_subscriptions'
    AND c.contype = 'u'
    AND EXISTS (
      SELECT 1 FROM pg_attribute a
      WHERE a.attrelid = t.oid
        AND a.attnum = ANY(c.conkey)
        AND a.attname = 'tenant_id'
    );
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE tenant_subscriptions DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END IF;
END $$;

-- 2. Agregar nuevas columnas a tenant_subscriptions
ALTER TABLE tenant_subscriptions 
  ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancel_scheduled_at TIMESTAMP WITH TIME ZONE;

-- Comentarios para documentación
COMMENT ON COLUMN tenant_subscriptions.is_addon IS 'Indica si es un plan adicional (addon) o el plan principal';
COMMENT ON COLUMN tenant_subscriptions.parent_subscription_id IS 'Referencia al plan principal si es addon';
COMMENT ON COLUMN tenant_subscriptions.display_order IS 'Orden de visualización (0 = principal, 1+ = addons)';
COMMENT ON COLUMN tenant_subscriptions.cancel_scheduled_at IS 'Fecha programada para cancelación al fin del período';

-- 3. Agregar columna management_status a pms_properties para downgrades
ALTER TABLE pms_properties 
  ADD COLUMN IF NOT EXISTS management_status TEXT DEFAULT 'active' 
  CHECK (management_status IN ('active', 'readonly', 'archived'));

COMMENT ON COLUMN pms_properties.management_status IS 'Estado de gestión: active (normal), readonly (límite excedido), archived (archivado)';

-- 4. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_active 
  ON tenant_subscriptions(tenant_id, status) 
  WHERE status IN ('active', 'trial');

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_parent 
  ON tenant_subscriptions(parent_subscription_id) 
  WHERE parent_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pms_properties_management_status 
  ON pms_properties(tenant_id, management_status);

-- 5. Crear función para obtener límites agregados de un tenant
CREATE OR REPLACE FUNCTION get_tenant_aggregated_limits(p_tenant_id UUID)
RETURNS TABLE (
  total_max_users INTEGER,
  total_max_properties INTEGER,
  total_max_contracts INTEGER,
  total_max_branches INTEGER,
  active_subscriptions_count INTEGER,
  primary_plan_name TEXT,
  primary_plan_id UUID,
  all_features JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_max_users INTEGER := 0;
  v_sum_properties INTEGER := 0;
  v_sum_contracts INTEGER := 0;
  v_sum_branches INTEGER := 0;
  v_count INTEGER := 0;
  v_primary_name TEXT;
  v_primary_id UUID;
  v_all_features JSONB := '[]'::JSONB;
  v_sub RECORD;
BEGIN
  -- Iterar sobre todas las suscripciones activas del tenant
  FOR v_sub IN
    SELECT 
      ts.id,
      ts.is_addon,
      ts.display_order,
      sp.name,
      sp.max_users,
      sp.max_properties,
      sp.max_contracts,
      sp.max_branches,
      sp.features
    FROM tenant_subscriptions ts
    JOIN subscription_plans sp ON sp.id = ts.plan_id
    WHERE ts.tenant_id = p_tenant_id
      AND ts.status IN ('active', 'trial')
    ORDER BY ts.display_order ASC, ts.created_at ASC
  LOOP
    v_count := v_count + 1;
    
    -- Para usuarios: tomar el MAX (el plan más alto)
    IF v_sub.max_users IS NOT NULL AND v_sub.max_users > v_max_users THEN
      v_max_users := v_sub.max_users;
    END IF;
    
    -- Para propiedades, contratos y sucursales: SUMAR
    v_sum_properties := v_sum_properties + COALESCE(v_sub.max_properties, 0);
    v_sum_contracts := v_sum_contracts + COALESCE(v_sub.max_contracts, 0);
    v_sum_branches := v_sum_branches + COALESCE(v_sub.max_branches, 0);
    
    -- Guardar el plan principal (primer plan no-addon o el primero en orden)
    IF v_primary_name IS NULL AND (NOT v_sub.is_addon OR v_sub.display_order = 0) THEN
      v_primary_name := v_sub.name;
      v_primary_id := v_sub.id;
    END IF;
    
    -- Acumular features de todos los planes
    IF v_sub.features IS NOT NULL THEN
      v_all_features := v_all_features || v_sub.features;
    END IF;
  END LOOP;
  
  -- Si no hay suscripciones, retornar valores por defecto
  IF v_count = 0 THEN
    RETURN QUERY SELECT 
      0::INTEGER,
      0::INTEGER,
      0::INTEGER,
      0::INTEGER,
      0::INTEGER,
      NULL::TEXT,
      NULL::UUID,
      '[]'::JSONB;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    v_max_users,
    v_sum_properties,
    v_sum_contracts,
    v_sum_branches,
    v_count,
    v_primary_name,
    v_primary_id,
    v_all_features;
END;
$$;

-- 6. Actualizar función check_tenant_limits para usar límites agregados
CREATE OR REPLACE FUNCTION check_tenant_limits(
  p_tenant_id UUID,
  p_resource_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_aggregated RECORD;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_allowed BOOLEAN;
  v_reason TEXT;
BEGIN
  -- Obtener límites agregados
  SELECT * INTO v_aggregated
  FROM get_tenant_aggregated_limits(p_tenant_id);
  
  -- Si no hay suscripción activa
  IF v_aggregated.active_subscriptions_count = 0 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'No hay suscripción activa',
      'current_count', 0,
      'limit', 0
    );
  END IF;
  
  -- Determinar límite y conteo según tipo de recurso
  CASE p_resource_type
    WHEN 'user' THEN
      v_limit := v_aggregated.total_max_users;
      SELECT COUNT(*) INTO v_current_count
      FROM user_roles
      WHERE tenant_id = p_tenant_id
        AND module = 'PMS'
        AND status = 'approved';
        
    WHEN 'property' THEN
      v_limit := v_aggregated.total_max_properties;
      SELECT COUNT(*) INTO v_current_count
      FROM pms_properties
      WHERE tenant_id = p_tenant_id
        AND management_status != 'archived';
        
    WHEN 'contract' THEN
      v_limit := v_aggregated.total_max_contracts;
      SELECT COUNT(*) INTO v_current_count
      FROM pms_contracts
      WHERE tenant_id = p_tenant_id
        AND status IN ('active', 'pending');
        
    WHEN 'branch' THEN
      v_limit := v_aggregated.total_max_branches;
      SELECT COUNT(*) INTO v_current_count
      FROM pms_tenants
      WHERE parent_tenant_id = p_tenant_id;
        
    ELSE
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Tipo de recurso no válido',
        'current_count', 0,
        'limit', 0
      );
  END CASE;
  
  -- Verificar si está permitido (NULL = ilimitado)
  IF v_limit IS NULL OR v_limit = 0 THEN
    -- 0 o NULL significa ilimitado
    v_allowed := true;
    v_reason := 'Ilimitado';
  ELSIF v_current_count < v_limit THEN
    v_allowed := true;
    v_reason := format('Disponible: %s de %s', v_current_count, v_limit);
  ELSE
    v_allowed := false;
    v_reason := format('Límite alcanzado: %s de %s', v_current_count, v_limit);
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'reason', v_reason,
    'current_count', v_current_count,
    'limit', v_limit,
    'aggregated_from_plans', v_aggregated.active_subscriptions_count
  );
END;
$$;

-- 7. Crear función para obtener estado completo de suscripción del tenant
CREATE OR REPLACE FUNCTION get_tenant_subscription_status(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_aggregated RECORD;
  v_subscriptions JSONB;
  v_current_users INTEGER;
  v_current_properties INTEGER;
  v_current_contracts INTEGER;
  v_current_branches INTEGER;
BEGIN
  -- Obtener límites agregados
  SELECT * INTO v_aggregated
  FROM get_tenant_aggregated_limits(p_tenant_id);
  
  -- Obtener lista de suscripciones activas con detalles
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'subscription_id', ts.id,
      'plan_id', ts.plan_id,
      'plan_name', sp.name,
      'status', ts.status,
      'billing_cycle', ts.billing_cycle,
      'is_addon', ts.is_addon,
      'display_order', ts.display_order,
      'current_period_start', ts.current_period_start,
      'current_period_end', ts.current_period_end,
      'cancel_scheduled_at', ts.cancel_scheduled_at,
      'max_users', sp.max_users,
      'max_properties', sp.max_properties,
      'max_contracts', sp.max_contracts,
      'max_branches', sp.max_branches,
      'price_monthly', sp.price_monthly,
      'price_yearly', sp.price_yearly,
      'features', sp.features
    ) ORDER BY ts.display_order, ts.created_at
  ), '[]'::JSONB) INTO v_subscriptions
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.tenant_id = p_tenant_id
    AND ts.status IN ('active', 'trial');
  
  -- Obtener conteos actuales
  SELECT COUNT(*) INTO v_current_users
  FROM user_roles
  WHERE tenant_id = p_tenant_id
    AND module = 'PMS'
    AND status = 'approved';
    
  SELECT COUNT(*) INTO v_current_properties
  FROM pms_properties
  WHERE tenant_id = p_tenant_id
    AND management_status != 'archived';
    
  SELECT COUNT(*) INTO v_current_contracts
  FROM pms_contracts
  WHERE tenant_id = p_tenant_id
    AND status IN ('active', 'pending');
    
  SELECT COUNT(*) INTO v_current_branches
  FROM pms_tenants
  WHERE parent_tenant_id = p_tenant_id;
  
  RETURN jsonb_build_object(
    'has_active_subscription', v_aggregated.active_subscriptions_count > 0,
    'subscriptions_count', v_aggregated.active_subscriptions_count,
    'primary_plan_name', v_aggregated.primary_plan_name,
    'subscriptions', v_subscriptions,
    'aggregated_limits', jsonb_build_object(
      'max_users', v_aggregated.total_max_users,
      'max_properties', v_aggregated.total_max_properties,
      'max_contracts', v_aggregated.total_max_contracts,
      'max_branches', v_aggregated.total_max_branches
    ),
    'current_usage', jsonb_build_object(
      'users', v_current_users,
      'properties', v_current_properties,
      'contracts', v_current_contracts,
      'branches', v_current_branches
    ),
    'usage_percentages', jsonb_build_object(
      'users', CASE WHEN COALESCE(v_aggregated.total_max_users, 0) > 0 
        THEN ROUND((v_current_users::NUMERIC / v_aggregated.total_max_users) * 100, 1) 
        ELSE 0 END,
      'properties', CASE WHEN COALESCE(v_aggregated.total_max_properties, 0) > 0 
        THEN ROUND((v_current_properties::NUMERIC / v_aggregated.total_max_properties) * 100, 1) 
        ELSE 0 END,
      'contracts', CASE WHEN COALESCE(v_aggregated.total_max_contracts, 0) > 0 
        THEN ROUND((v_current_contracts::NUMERIC / v_aggregated.total_max_contracts) * 100, 1) 
        ELSE 0 END,
      'branches', CASE WHEN COALESCE(v_aggregated.total_max_branches, 0) > 0 
        THEN ROUND((v_current_branches::NUMERIC / v_aggregated.total_max_branches) * 100, 1) 
        ELSE 0 END
    ),
    'all_features', v_aggregated.all_features
  );
END;
$$;

-- 8. Crear tabla para solicitudes de addon
CREATE TABLE IF NOT EXISTS addon_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id) ON DELETE CASCADE,
  requested_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  requested_by UUID NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected', 'cancelled')),
  reason TEXT,
  admin_notes TEXT,
  contacted_at TIMESTAMP WITH TIME ZONE,
  contacted_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  resulting_subscription_id UUID REFERENCES tenant_subscriptions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para addon_requests
CREATE INDEX IF NOT EXISTS idx_addon_requests_tenant ON addon_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_addon_requests_status ON addon_requests(status);
CREATE INDEX IF NOT EXISTS idx_addon_requests_pending ON addon_requests(status, created_at) WHERE status = 'pending';

-- Comentarios
COMMENT ON TABLE addon_requests IS 'Solicitudes de planes adicionales de los tenants';
COMMENT ON COLUMN addon_requests.status IS 'pending: nueva solicitud, contacted: admin contactó al cliente, approved: aprobada y suscripción creada, rejected: rechazada, cancelled: cancelada por el usuario';

-- RLS para addon_requests
ALTER TABLE addon_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Granada admins can manage all addon requests"
  ON addon_requests FOR ALL
  USING (is_granada_admin(auth.uid()));

CREATE POLICY "Client admins can view their own addon requests"
  ON addon_requests FOR SELECT
  USING (is_client_admin(auth.uid(), tenant_id));

CREATE POLICY "Client admins can create addon requests"
  ON addon_requests FOR INSERT
  WITH CHECK (is_client_admin(auth.uid(), tenant_id));

CREATE POLICY "Client admins can cancel their pending requests"
  ON addon_requests FOR UPDATE
  USING (is_client_admin(auth.uid(), tenant_id) AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- 9. Trigger para actualizar updated_at en addon_requests
CREATE OR REPLACE FUNCTION update_addon_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_addon_requests_updated_at
  BEFORE UPDATE ON addon_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_addon_requests_updated_at();

-- 10. Marcar suscripciones existentes como no-addon (plan principal)
UPDATE tenant_subscriptions 
SET is_addon = false, display_order = 0 
WHERE is_addon IS NULL OR is_addon = false;