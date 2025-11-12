-- Create subscription_change_requests table
CREATE TABLE IF NOT EXISTS subscription_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id) ON DELETE CASCADE,
  current_plan_id UUID REFERENCES subscription_plans(id),
  requested_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_change_requests_tenant_id 
ON subscription_change_requests(tenant_id);

CREATE INDEX IF NOT EXISTS idx_subscription_change_requests_status 
ON subscription_change_requests(status);

-- Enable RLS
ALTER TABLE subscription_change_requests ENABLE ROW LEVEL SECURITY;

-- Policy: CLIENT_ADMIN can view their requests
CREATE POLICY "client_admin_view_own_requests" ON subscription_change_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pms_client_users
    WHERE user_id = auth.uid()
      AND tenant_id = subscription_change_requests.tenant_id
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);

-- Policy: CLIENT_ADMIN can create requests
CREATE POLICY "client_admin_create_requests" ON subscription_change_requests
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM pms_client_users
    WHERE user_id = auth.uid()
      AND tenant_id = subscription_change_requests.tenant_id
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);

-- Policy: Granada Admin can view all
CREATE POLICY "granada_admin_view_all_requests" ON subscription_change_requests
FOR SELECT USING (is_granada_admin(auth.uid()));

-- Policy: Granada Admin can update
CREATE POLICY "granada_admin_update_requests" ON subscription_change_requests
FOR UPDATE USING (is_granada_admin(auth.uid()));

-- Create RPC: get_client_statistics
CREATE OR REPLACE FUNCTION get_client_statistics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
  v_total_propietarios INT;
  v_total_inquilinos INT;
  v_total_properties INT;
  v_total_active_contracts INT;
  v_pending_payments INT;
  v_monthly_revenue NUMERIC;
BEGIN
  -- Count PROPIETARIO users
  SELECT COUNT(*) INTO v_total_propietarios
  FROM pms_client_users
  WHERE tenant_id = p_tenant_id
    AND user_type = 'PROPIETARIO'
    AND is_active = true;
  
  -- Count INQUILINO users
  SELECT COUNT(*) INTO v_total_inquilinos
  FROM pms_client_users
  WHERE tenant_id = p_tenant_id
    AND user_type = 'INQUILINO'
    AND is_active = true;
  
  -- Count properties
  SELECT COUNT(*) INTO v_total_properties
  FROM pms_properties
  WHERE tenant_id = p_tenant_id;
  
  -- Count active contracts
  SELECT COUNT(*) INTO v_total_active_contracts
  FROM pms_contracts
  WHERE tenant_id = p_tenant_id
    AND status = 'active';
  
  -- Count pending payments
  SELECT COUNT(*) INTO v_pending_payments
  FROM pms_payment_schedule_items
  WHERE tenant_id = p_tenant_id
    AND status IN ('pending', 'overdue');
  
  -- Sum monthly revenue (current month)
  SELECT COALESCE(SUM(paid_amount), 0) INTO v_monthly_revenue
  FROM pms_payments
  WHERE tenant_id = p_tenant_id
    AND status = 'paid'
    AND DATE_TRUNC('month', paid_date) = DATE_TRUNC('month', CURRENT_DATE);
  
  v_stats := jsonb_build_object(
    'total_propietarios', v_total_propietarios,
    'total_inquilinos', v_total_inquilinos,
    'total_properties', v_total_properties,
    'total_active_contracts', v_total_active_contracts,
    'pending_payments', v_pending_payments,
    'monthly_revenue', v_monthly_revenue
  );
  
  RETURN v_stats;
END;
$$;

-- Create RPC: get_client_activity_log
CREATE OR REPLACE FUNCTION get_client_activity_log(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  activity_type TEXT,
  description TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is a placeholder - actual activity logging would require an activity_log table
  -- For now, return empty result set
  RETURN QUERY
  SELECT 
    'system'::TEXT as activity_type,
    'Activity logging not yet implemented'::TEXT as description,
    ''::TEXT as user_email,
    NOW() as created_at
  LIMIT 0;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_client_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_activity_log(UUID, INTEGER) TO authenticated;