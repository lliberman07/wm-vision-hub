-- Fix check_tenant_limits to use RECORD instead of JSONB
-- get_tenant_aggregated_limits returns a TABLE, not JSONB
CREATE OR REPLACE FUNCTION public.check_tenant_limits(p_tenant_id UUID, p_resource_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aggregated RECORD;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_allowed BOOLEAN;
  v_reason TEXT;
BEGIN
  -- Obtener límites agregados usando SELECT INTO (porque retorna TABLE)
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
      -- FIXED: usar COUNT(DISTINCT user_id) para contar usuarios únicos
      SELECT COUNT(DISTINCT user_id) INTO v_current_count
      FROM user_roles
      WHERE tenant_id = p_tenant_id
        AND module = 'PMS'
        AND status = 'approved';
        
    WHEN 'property' THEN
      v_limit := v_aggregated.total_max_properties;
      SELECT COUNT(*) INTO v_current_count
      FROM pms_properties
      WHERE tenant_id = p_tenant_id;
      
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
  
  -- Determinar si está permitido
  IF v_limit IS NULL THEN
    v_allowed := true;
    v_reason := 'Sin límite';
  ELSIF v_current_count < v_limit THEN
    v_allowed := true;
    v_reason := 'Dentro del límite';
  ELSE
    v_allowed := false;
    v_reason := 'Límite alcanzado';
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'reason', v_reason,
    'current_count', v_current_count,
    'limit', v_limit
  );
END;
$$;