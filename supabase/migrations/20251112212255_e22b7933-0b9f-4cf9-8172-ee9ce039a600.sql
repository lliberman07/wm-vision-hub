-- Tabla para historial de cambios de suscripción
CREATE TABLE IF NOT EXISTS subscription_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES pms_tenants(id) ON DELETE CASCADE,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'billing_cycle_change', 'cancellation', 'activation', 'suspension')),
  old_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  old_billing_cycle TEXT,
  new_billing_cycle TEXT,
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2),
  reason TEXT,
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_change_history_subscription ON subscription_change_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_change_history_tenant ON subscription_change_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_change_history_changed_at ON subscription_change_history(changed_at);

-- Función principal de analítica de suscripciones
CREATE OR REPLACE FUNCTION get_granada_subscription_analytics(p_months_back INTEGER DEFAULT 12)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_current_month DATE;
  v_start_date DATE;
  v_active_subs INTEGER;
  v_trial_subs INTEGER;
  v_suspended_subs INTEGER;
  v_cancelled_subs INTEGER;
  v_mrr_total NUMERIC;
  v_arr_total NUMERIC;
  v_mrr_last_month NUMERIC;
  v_growth_rate NUMERIC;
  v_churn_rate NUMERIC;
  v_new_subs_month INTEGER;
  v_cancelled_subs_month INTEGER;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE);
  v_start_date := v_current_month - (p_months_back || ' months')::INTERVAL;

  -- Métricas principales
  SELECT 
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'trial'),
    COUNT(*) FILTER (WHERE status = 'suspended'),
    COUNT(*) FILTER (WHERE status = 'cancelled')
  INTO v_active_subs, v_trial_subs, v_suspended_subs, v_cancelled_subs
  FROM tenant_subscriptions;

  -- Calcular MRR (Monthly Recurring Revenue)
  SELECT COALESCE(SUM(
    CASE 
      WHEN ts.billing_cycle = 'monthly' THEN sp.price
      WHEN ts.billing_cycle = 'annual' THEN sp.price / 12.0
      ELSE 0
    END
  ), 0)
  INTO v_mrr_total
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.status IN ('active', 'trial');

  -- ARR = MRR * 12
  v_arr_total := v_mrr_total * 12;

  -- MRR del mes pasado
  SELECT COALESCE(SUM(
    CASE 
      WHEN ts.billing_cycle = 'monthly' THEN sp.price
      WHEN ts.billing_cycle = 'annual' THEN sp.price / 12.0
      ELSE 0
    END
  ), 0)
  INTO v_mrr_last_month
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.status IN ('active', 'trial')
    AND ts.created_at < v_current_month;

  -- Tasa de crecimiento MRR
  IF v_mrr_last_month > 0 THEN
    v_growth_rate := ((v_mrr_total - v_mrr_last_month) / v_mrr_last_month) * 100;
  ELSE
    v_growth_rate := 0;
  END IF;

  -- Nuevas suscripciones este mes
  SELECT COUNT(*)
  INTO v_new_subs_month
  FROM tenant_subscriptions
  WHERE created_at >= v_current_month;

  -- Cancelaciones este mes
  SELECT COUNT(*)
  INTO v_cancelled_subs_month
  FROM subscription_change_history
  WHERE change_type = 'cancellation'
    AND changed_at >= v_current_month;

  -- Churn rate (cancelaciones / total activo al inicio del mes)
  IF v_active_subs > 0 THEN
    v_churn_rate := (v_cancelled_subs_month::NUMERIC / (v_active_subs + v_cancelled_subs_month)) * 100;
  ELSE
    v_churn_rate := 0;
  END IF;

  -- Construir resultado con métricas principales
  v_result := jsonb_build_object(
    'main_metrics', jsonb_build_object(
      'active_subscriptions', v_active_subs,
      'trial_subscriptions', v_trial_subs,
      'suspended_subscriptions', v_suspended_subs,
      'cancelled_subscriptions', v_cancelled_subs,
      'mrr_total', ROUND(v_mrr_total, 2),
      'arr_total', ROUND(v_arr_total, 2),
      'mrr_last_month', ROUND(v_mrr_last_month, 2),
      'growth_rate', ROUND(v_growth_rate, 2),
      'churn_rate', ROUND(v_churn_rate, 2),
      'new_subs_month', v_new_subs_month,
      'cancelled_subs_month', v_cancelled_subs_month
    )
  );

  -- Evolución temporal (últimos N meses)
  v_result := v_result || jsonb_build_object(
    'temporal_evolution',
    (
      SELECT jsonb_agg(month_data ORDER BY month)
      FROM (
        SELECT 
          TO_CHAR(month_date, 'YYYY-MM') as month,
          COALESCE(SUM(
            CASE 
              WHEN ts.billing_cycle = 'monthly' THEN sp.price
              WHEN ts.billing_cycle = 'annual' THEN sp.price / 12.0
              ELSE 0
            END
          ), 0) as mrr,
          COUNT(DISTINCT ts.id) FILTER (WHERE ts.created_at >= month_date AND ts.created_at < month_date + INTERVAL '1 month') as new_subs,
          COUNT(DISTINCT sch.id) FILTER (WHERE sch.change_type = 'cancellation') as cancelled_subs,
          COUNT(DISTINCT ts.id) FILTER (WHERE ts.status IN ('active', 'trial') AND ts.created_at <= month_date) as active_subs_total
        FROM generate_series(v_start_date, v_current_month, '1 month'::INTERVAL) as month_date
        LEFT JOIN tenant_subscriptions ts ON ts.created_at <= month_date + INTERVAL '1 month'
        LEFT JOIN subscription_plans sp ON sp.id = ts.plan_id
        LEFT JOIN subscription_change_history sch ON sch.changed_at >= month_date 
          AND sch.changed_at < month_date + INTERVAL '1 month'
        GROUP BY month_date
      ) month_data
    )
  );

  -- Distribución por tipo de facturación
  v_result := v_result || jsonb_build_object(
    'billing_distribution',
    (
      SELECT jsonb_agg(billing_data)
      FROM (
        SELECT 
          ts.billing_cycle as type,
          COUNT(*) as count,
          COALESCE(SUM(
            CASE 
              WHEN ts.billing_cycle = 'monthly' THEN sp.price
              WHEN ts.billing_cycle = 'annual' THEN sp.price / 12.0
              ELSE 0
            END
          ), 0) as mrr
        FROM tenant_subscriptions ts
        JOIN subscription_plans sp ON sp.id = ts.plan_id
        WHERE ts.status IN ('active', 'trial')
        GROUP BY ts.billing_cycle
      ) billing_data
    )
  );

  -- Distribución por plan (Top 5 en subquery separado)
  v_result := v_result || jsonb_build_object(
    'plan_distribution',
    (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          sp.name as plan_name,
          sp.id as plan_id,
          COUNT(*) as count,
          ts.status,
          COALESCE(SUM(
            CASE 
              WHEN ts.billing_cycle = 'monthly' THEN sp.price
              WHEN ts.billing_cycle = 'annual' THEN sp.price / 12.0
              ELSE 0
            END
          ), 0) as mrr
        FROM tenant_subscriptions ts
        JOIN subscription_plans sp ON sp.id = ts.plan_id
        WHERE ts.status IN ('active', 'trial')
        GROUP BY sp.name, sp.id, ts.status
        ORDER BY COUNT(*) DESC
        LIMIT 5
      ) t
    )
  );

  RETURN v_result;
END;
$$;

-- Función para obtener ingresos por método de pago
CREATE OR REPLACE FUNCTION get_revenue_by_payment_method(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE(
  payment_method TEXT,
  transaction_count BIGINT,
  total_ars NUMERIC,
  total_usd NUMERIC,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_total NUMERIC;
BEGIN
  v_start_date := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE));
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  -- Calcular total general
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_total
  FROM subscription_invoices
  WHERE status = 'paid'
    AND paid_date >= v_start_date
    AND paid_date <= v_end_date;

  RETURN QUERY
  SELECT 
    COALESCE(si.payment_method, 'No especificado') as payment_method,
    COUNT(*)::BIGINT as transaction_count,
    COALESCE(SUM(si.total_amount) FILTER (WHERE si.currency = 'ARS'), 0) as total_ars,
    COALESCE(SUM(si.total_amount) FILTER (WHERE si.currency = 'USD'), 0) as total_usd,
    CASE 
      WHEN v_total > 0 THEN ROUND((COALESCE(SUM(si.total_amount), 0) / v_total) * 100, 2)
      ELSE 0
    END as percentage
  FROM subscription_invoices si
  WHERE si.status = 'paid'
    AND si.paid_date >= v_start_date
    AND si.paid_date <= v_end_date
  GROUP BY si.payment_method
  ORDER BY total_ars + total_usd DESC;
END;
$$;

-- Función para obtener cambios de plan
CREATE OR REPLACE FUNCTION get_subscription_plan_changes(p_tenant_id UUID DEFAULT NULL, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  subscription_id UUID,
  tenant_name TEXT,
  change_type TEXT,
  old_plan_name TEXT,
  new_plan_name TEXT,
  old_billing_cycle TEXT,
  new_billing_cycle TEXT,
  old_price NUMERIC,
  new_price NUMERIC,
  changed_at TIMESTAMP WITH TIME ZONE,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE));
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  RETURN QUERY
  SELECT 
    sch.id,
    sch.subscription_id,
    t.name as tenant_name,
    sch.change_type,
    sp_old.name as old_plan_name,
    sp_new.name as new_plan_name,
    sch.old_billing_cycle,
    sch.new_billing_cycle,
    sch.old_price,
    sch.new_price,
    sch.changed_at,
    sch.reason
  FROM subscription_change_history sch
  LEFT JOIN pms_tenants t ON t.id = sch.tenant_id
  LEFT JOIN subscription_plans sp_old ON sp_old.id = sch.old_plan_id
  LEFT JOIN subscription_plans sp_new ON sp_new.id = sch.new_plan_id
  WHERE (p_tenant_id IS NULL OR sch.tenant_id = p_tenant_id)
    AND sch.changed_at >= v_start_date
    AND sch.changed_at <= v_end_date
  ORDER BY sch.changed_at DESC;
END;
$$;