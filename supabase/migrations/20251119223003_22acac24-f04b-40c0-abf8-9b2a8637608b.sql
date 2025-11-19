-- Actualizar check_tenant_limits para contar solo propiedades activas
CREATE OR REPLACE FUNCTION check_tenant_limits(
  p_tenant_id UUID,
  p_resource_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
  v_plan RECORD;
BEGIN
  SELECT sp.* INTO v_plan
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.tenant_id = p_tenant_id
    AND ts.status IN ('active', 'trial')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'No active subscription', 'current_count', 0, 'limit', 0);
  END IF;

  CASE p_resource_type
    WHEN 'property' THEN
      SELECT COUNT(*) INTO v_current_count FROM pms_properties
      WHERE tenant_id = p_tenant_id AND status IN ('active', 'rented', 'maintenance');
      v_limit := v_plan.max_properties;
    WHEN 'user' THEN
      SELECT COUNT(DISTINCT user_id) INTO v_current_count FROM user_roles
      WHERE tenant_id = p_tenant_id AND module = 'PMS' AND status = 'approved';
      v_limit := v_plan.max_users;
    WHEN 'contract' THEN
      SELECT COUNT(*) INTO v_current_count FROM pms_contracts
      WHERE tenant_id = p_tenant_id AND status = 'active';
      v_limit := v_plan.max_contracts;
    WHEN 'branch' THEN
      SELECT COUNT(*) INTO v_current_count FROM pms_tenants
      WHERE parent_tenant_id = p_tenant_id;
      v_limit := v_plan.max_branches;
    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'Invalid resource type', 'current_count', 0, 'limit', 0);
  END CASE;

  RETURN jsonb_build_object(
    'allowed', v_current_count < COALESCE(v_limit, 999999),
    'reason', CASE WHEN v_current_count >= COALESCE(v_limit, 999999) THEN 'Limit reached' ELSE 'OK' END,
    'current_count', v_current_count,
    'limit', v_limit
  );
END;
$$;