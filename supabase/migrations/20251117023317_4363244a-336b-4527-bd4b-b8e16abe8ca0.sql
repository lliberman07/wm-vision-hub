-- Fix field names in RPC function to match component expectations
DROP FUNCTION IF EXISTS get_granada_subscription_analytics(INTEGER);

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

  -- Calcular MRR
  SELECT COALESCE(SUM(
    CASE 
      WHEN ts.billing_cycle = 'monthly' THEN sp.price_monthly
      WHEN ts.billing_cycle = 'yearly' THEN sp.price_yearly / 12.0
      ELSE 0
    END
  ), 0)
  INTO v_mrr_total
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.status IN ('active', 'trial');

  v_arr_total := v_mrr_total * 12;

  -- MRR del mes pasado
  SELECT COALESCE(SUM(
    CASE 
      WHEN ts.billing_cycle = 'monthly' THEN sp.price_monthly
      WHEN ts.billing_cycle = 'yearly' THEN sp.price_yearly / 12.0
      ELSE 0
    END
  ), 0)
  INTO v_mrr_last_month
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.status IN ('active', 'trial')
    AND ts.created_at < v_current_month;

  IF v_mrr_last_month > 0 THEN
    v_growth_rate := ((v_mrr_total - v_mrr_last_month) / v_mrr_last_month) * 100;
  ELSE
    v_growth_rate := 0;
  END IF;

  SELECT COUNT(*)
  INTO v_new_subs_month
  FROM tenant_subscriptions
  WHERE created_at >= v_current_month;

  SELECT COUNT(*)
  INTO v_cancelled_subs_month
  FROM subscription_change_history
  WHERE change_type = 'cancellation'
    AND changed_at >= v_current_month;

  IF v_active_subs > 0 THEN
    v_churn_rate := (v_cancelled_subs_month::NUMERIC / (v_active_subs + v_cancelled_subs_month)) * 100;
  ELSE
    v_churn_rate := 0;
  END IF;

  v_result := jsonb_build_object(
    'main_metrics', jsonb_build_object(
      'active_subscriptions', v_active_subs,
      'trial_subscriptions', v_trial_subs,
      'suspended_subscriptions', v_suspended_subs,
      'cancelled_subscriptions', v_cancelled_subs,
      'mrr_total', v_mrr_total,
      'arr_total', v_arr_total,
      'mrr_last_month', v_mrr_last_month,
      'growth_rate', v_growth_rate,
      'churn_rate', v_churn_rate,
      'new_subs_month', v_new_subs_month,
      'cancelled_subs_month', v_cancelled_subs_month
    ),
    'temporal_evolution', (
      SELECT COALESCE(jsonb_agg(month_data ORDER BY month), '[]'::jsonb)
      FROM (
        SELECT 
          DATE_TRUNC('month', ts.created_at) as month,
          COUNT(CASE WHEN ts.status = 'active' THEN 1 END) as active_count,
          COUNT(CASE WHEN ts.status = 'trial' THEN 1 END) as trial_count,
          SUM(
            CASE 
              WHEN ts.status IN ('active', 'trial') AND ts.billing_cycle = 'monthly' THEN sp.price_monthly
              WHEN ts.status IN ('active', 'trial') AND ts.billing_cycle = 'yearly' THEN sp.price_yearly / 12.0
              ELSE 0
            END
          ) as mrr
        FROM tenant_subscriptions ts
        JOIN subscription_plans sp ON sp.id = ts.plan_id
        WHERE ts.created_at >= v_start_date
        GROUP BY DATE_TRUNC('month', ts.created_at)
      ) month_data
    ),
    'billing_distribution', (
      SELECT jsonb_build_object(
        'monthly', COALESCE(COUNT(CASE WHEN billing_cycle = 'monthly' THEN 1 END), 0),
        'yearly', COALESCE(COUNT(CASE WHEN billing_cycle = 'yearly' THEN 1 END), 0)
      )
      FROM tenant_subscriptions
      WHERE status IN ('active', 'trial')
    ),
    'plan_distribution', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'plan_name', sp.name,
          'count', plan_count
        )
      ), '[]'::jsonb)
      FROM (
        SELECT sp.name, COUNT(*) as plan_count
        FROM tenant_subscriptions ts
        JOIN subscription_plans sp ON sp.id = ts.plan_id
        WHERE ts.status IN ('active', 'trial')
        GROUP BY sp.name
      ) sp
    )
  );

  RETURN v_result;
END;
$$;