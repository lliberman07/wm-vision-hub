-- Fix temporal_evolution to include all required fields
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
      SELECT COALESCE(jsonb_agg(row_to_json(month_data) ORDER BY month), '[]'::jsonb)
      FROM (
        WITH months AS (
          SELECT generate_series(
            v_start_date,
            v_current_month,
            '1 month'::interval
          )::date AS month
        ),
        subscriptions_by_month AS (
          SELECT 
            DATE_TRUNC('month', ts.created_at)::date as month,
            COUNT(*) as new_subs,
            SUM(
              CASE 
                WHEN ts.billing_cycle = 'monthly' THEN sp.price_monthly
                WHEN ts.billing_cycle = 'yearly' THEN sp.price_yearly / 12.0
                ELSE 0
              END
            ) as mrr_new
          FROM tenant_subscriptions ts
          JOIN subscription_plans sp ON sp.id = ts.plan_id
          WHERE ts.created_at >= v_start_date
          GROUP BY DATE_TRUNC('month', ts.created_at)::date
        ),
        cancellations_by_month AS (
          SELECT 
            DATE_TRUNC('month', changed_at)::date as month,
            COUNT(*) as cancelled_subs
          FROM subscription_change_history
          WHERE change_type = 'cancellation'
            AND changed_at >= v_start_date
          GROUP BY DATE_TRUNC('month', changed_at)::date
        ),
        active_by_month AS (
          SELECT 
            m.month,
            COUNT(ts.id) as active_count
          FROM months m
          LEFT JOIN tenant_subscriptions ts ON ts.created_at <= m.month + interval '1 month' - interval '1 day'
            AND (ts.status IN ('active', 'trial') OR (ts.cancelled_at IS NULL OR ts.cancelled_at > m.month))
          GROUP BY m.month
        )
        SELECT 
          TO_CHAR(m.month, 'YYYY-MM') as month,
          COALESCE(sbm.mrr_new, 0) as mrr,
          COALESCE(sbm.new_subs, 0) as new_subs,
          COALESCE(cbm.cancelled_subs, 0) as cancelled_subs,
          COALESCE(abm.active_count, 0) as active_subs_total
        FROM months m
        LEFT JOIN subscriptions_by_month sbm ON sbm.month = m.month
        LEFT JOIN cancellations_by_month cbm ON cbm.month = m.month
        LEFT JOIN active_by_month abm ON abm.month = m.month
        ORDER BY m.month
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