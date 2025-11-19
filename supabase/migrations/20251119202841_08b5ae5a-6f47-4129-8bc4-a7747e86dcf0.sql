-- FASE 2: Funciones, Triggers y Políticas

-- 2.1 Actualizar propiedades con contrato activo a 'rented'
DO $$
DECLARE
  prop_record RECORD;
BEGIN
  FOR prop_record IN
    SELECT DISTINCT p.id
    FROM pms_properties p
    INNER JOIN pms_contracts c ON c.property_id = p.id
    WHERE c.status = 'active'
      AND c.start_date <= CURRENT_DATE
      AND c.end_date >= CURRENT_DATE
      AND p.status != 'rented'::property_status
  LOOP
    UPDATE pms_properties
    SET status = 'rented'::property_status
    WHERE id = prop_record.id;
  END LOOP;
END $$;

-- 2.2 Función: Obtener propiedades activas
CREATE OR REPLACE FUNCTION get_tenant_active_properties(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  code TEXT,
  address TEXT,
  status TEXT,
  has_active_contract BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.code,
    p.address,
    p.status::TEXT,
    EXISTS(
      SELECT 1 FROM pms_contracts c 
      WHERE c.property_id = p.id 
        AND c.status = 'active'
        AND c.start_date <= CURRENT_DATE
        AND c.end_date >= CURRENT_DATE
    ) as has_active_contract
  FROM pms_properties p
  WHERE p.tenant_id = p_tenant_id
    AND p.status IN ('active', 'rented', 'maintenance')
  ORDER BY p.created_at DESC;
$$;

-- 2.3 Trigger: Auto cambiar a 'rented' al activar contrato
CREATE OR REPLACE FUNCTION auto_set_property_rented()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status != 'active' 
     AND NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
    UPDATE pms_properties
    SET status = 'rented'::property_status
    WHERE id = NEW.property_id
      AND status != 'rented'::property_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_contract_activated ON pms_contracts;
CREATE TRIGGER trigger_contract_activated
AFTER UPDATE ON pms_contracts
FOR EACH ROW
WHEN (NEW.status = 'active' AND OLD.status != 'active')
EXECUTE FUNCTION auto_set_property_rented();

-- 2.4 Trigger: Auto cambiar a 'active' al cancelar/expirar contrato
CREATE OR REPLACE FUNCTION auto_set_property_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'expired') AND OLD.status = 'active' THEN
    UPDATE pms_properties
    SET status = 'active'::property_status
    WHERE id = NEW.property_id
      AND status = 'rented'::property_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_contract_ended ON pms_contracts;
CREATE TRIGGER trigger_contract_ended
AFTER UPDATE ON pms_contracts
FOR EACH ROW
WHEN (NEW.status IN ('cancelled', 'expired') AND OLD.status = 'active')
EXECUTE FUNCTION auto_set_property_active();

-- 2.5 RLS Policy: No cambiar 'rented' con contrato activo
DROP POLICY IF EXISTS "Cannot change rented property with active contract" ON pms_properties;
CREATE POLICY "Cannot change rented property with active contract"
ON pms_properties
FOR UPDATE
USING (
  status != 'rented'::property_status OR 
  NOT EXISTS (
    SELECT 1 FROM pms_contracts 
    WHERE property_id = pms_properties.id 
      AND status = 'active'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE
  )
);

-- 2.6 Vista: Tenants que exceden límites
CREATE OR REPLACE VIEW tenants_exceeding_limits AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  sp.name as plan_name,
  sp.id as plan_id,
  COUNT(DISTINCT CASE WHEN p.status IN ('active', 'rented', 'maintenance') THEN p.id END) as active_properties,
  sp.max_properties as property_limit,
  COUNT(DISTINCT CASE WHEN p.status IN ('active', 'rented', 'maintenance') THEN p.id END) - COALESCE(sp.max_properties, 0) as property_exceeds_by,
  COUNT(DISTINCT CASE WHEN ur.status = 'approved' THEN ur.user_id END) as active_users,
  sp.max_users as user_limit,
  COUNT(DISTINCT CASE WHEN ur.status = 'approved' THEN ur.user_id END) - COALESCE(sp.max_users, 0) as user_exceeds_by,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_contracts,
  sp.max_contracts as contract_limit,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) - COALESCE(sp.max_contracts, 0) as contract_exceeds_by
FROM pms_tenants t
JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
JOIN subscription_plans sp ON sp.id = ts.plan_id
LEFT JOIN pms_properties p ON p.tenant_id = t.id
LEFT JOIN user_roles ur ON ur.tenant_id = t.id AND ur.module = 'PMS'
LEFT JOIN pms_contracts c ON c.tenant_id = t.id
WHERE ts.status IN ('active', 'trial')
GROUP BY t.id, t.name, sp.name, sp.id, sp.max_properties, sp.max_users, sp.max_contracts
HAVING 
  COUNT(DISTINCT CASE WHEN p.status IN ('active', 'rented', 'maintenance') THEN p.id END) > COALESCE(sp.max_properties, 999999)
  OR COUNT(DISTINCT CASE WHEN ur.status = 'approved' THEN ur.user_id END) > COALESCE(sp.max_users, 999999)
  OR COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) > COALESCE(sp.max_contracts, 999999);