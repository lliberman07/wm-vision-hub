-- Fix check_subscription_alerts function: change_date -> changed_at
CREATE OR REPLACE FUNCTION check_subscription_alerts()
RETURNS TABLE (
  alert_type TEXT,
  severity TEXT,
  metric_value DECIMAL(10,2),
  threshold_value DECIMAL(10,2),
  message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_month_start DATE := date_trunc('month', CURRENT_DATE);
  v_current_month_end DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  v_last_month_start DATE := (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::DATE;
  v_last_month_end DATE := (date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::DATE;
  v_week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
  
  v_current_active INTEGER;
  v_current_month_cancellations INTEGER;
  v_churn_rate DECIMAL(10,2);
  v_current_mrr DECIMAL(10,2);
  v_last_mrr DECIMAL(10,2);
  v_mrr_change_pct DECIMAL(10,2);
  v_week_cancellations INTEGER;
  v_alert_exists BOOLEAN;
BEGIN
  -- Calculate current active subscriptions
  SELECT COUNT(*)
  INTO v_current_active
  FROM public.tenant_subscriptions
  WHERE status = 'active';
  
  -- Calculate cancellations this month (FIXED: changed_at instead of change_date)
  SELECT COUNT(*)
  INTO v_current_month_cancellations
  FROM public.subscription_change_history
  WHERE change_type = 'cancellation'
  AND changed_at >= v_current_month_start
  AND changed_at <= v_current_month_end;
  
  -- Calculate churn rate
  IF v_current_active > 0 THEN
    v_churn_rate := (v_current_month_cancellations::DECIMAL / v_current_active::DECIMAL) * 100;
  ELSE
    v_churn_rate := 0;
  END IF;
  
  -- CHECK 1: High churn rate (> 15%)
  IF v_churn_rate > 15 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.subscription_alerts
      WHERE alert_type = 'high_churn_rate'
      AND period_start = v_current_month_start
      AND period_end = v_current_month_end
    ) INTO v_alert_exists;
    
    IF NOT v_alert_exists THEN
      INSERT INTO public.subscription_alerts (
        alert_type, severity, metric_value, threshold_value,
        period_start, period_end, details
      ) VALUES (
        'high_churn_rate',
        CASE WHEN v_churn_rate > 25 THEN 'critical' ELSE 'warning' END,
        v_churn_rate,
        15.00,
        v_current_month_start,
        v_current_month_end,
        jsonb_build_object(
          'active_subscriptions', v_current_active,
          'cancellations', v_current_month_cancellations
        )
      );
      
      RETURN QUERY SELECT 
        'high_churn_rate'::TEXT,
        CASE WHEN v_churn_rate > 25 THEN 'critical' ELSE 'warning' END::TEXT,
        v_churn_rate,
        15.00::DECIMAL(10,2),
        format('Churn rate del %s%% supera el umbral del 15%%', v_churn_rate)::TEXT;
    END IF;
  END IF;
  
  -- Calculate current MRR (FIXED: price_monthly/price_yearly instead of price)
  SELECT COALESCE(SUM(
    CASE 
      WHEN ts.billing_cycle = 'monthly' THEN sp.price_monthly
      WHEN ts.billing_cycle = 'annual' THEN sp.price_yearly / 12.0
      ELSE 0
    END
  ), 0)
  INTO v_current_mrr
  FROM public.tenant_subscriptions ts
  JOIN public.subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.status IN ('active', 'trial');
  
  -- Calculate last month MRR (FIXED: price_monthly/price_yearly instead of price)
  SELECT COALESCE(SUM(
    CASE 
      WHEN ts.billing_cycle = 'monthly' THEN sp.price_monthly
      WHEN ts.billing_cycle = 'annual' THEN sp.price_yearly / 12.0
      ELSE 0
    END
  ), 0)
  INTO v_last_mrr
  FROM public.tenant_subscriptions ts
  JOIN public.subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.status IN ('active', 'trial')
  AND ts.created_at < v_current_month_start;
  
  -- Calculate MRR change percentage
  IF v_last_mrr > 0 THEN
    v_mrr_change_pct := ((v_current_mrr - v_last_mrr) / v_last_mrr) * 100;
  ELSE
    v_mrr_change_pct := 0;
  END IF;
  
  -- CHECK 2: MRR drop (> 20%)
  IF v_mrr_change_pct < -20 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.subscription_alerts
      WHERE alert_type = 'mrr_drop'
      AND period_start = v_current_month_start
      AND period_end = v_current_month_end
    ) INTO v_alert_exists;
    
    IF NOT v_alert_exists THEN
      INSERT INTO public.subscription_alerts (
        alert_type, severity, metric_value, threshold_value,
        period_start, period_end, details
      ) VALUES (
        'mrr_drop',
        CASE WHEN v_mrr_change_pct < -40 THEN 'critical' ELSE 'warning' END,
        ABS(v_mrr_change_pct),
        20.00,
        v_current_month_start,
        v_current_month_end,
        jsonb_build_object(
          'current_mrr', v_current_mrr,
          'last_month_mrr', v_last_mrr
        )
      );
      
      RETURN QUERY SELECT 
        'mrr_drop'::TEXT,
        CASE WHEN v_mrr_change_pct < -40 THEN 'critical' ELSE 'warning' END::TEXT,
        ABS(v_mrr_change_pct),
        20.00::DECIMAL(10,2),
        format('MRR cayó un %s%% respecto al mes anterior', ABS(v_mrr_change_pct))::TEXT;
    END IF;
  END IF;
  
  -- Calculate cancellations in last week (FIXED: changed_at instead of change_date)
  SELECT COUNT(*)
  INTO v_week_cancellations
  FROM public.subscription_change_history
  WHERE change_type = 'cancellation'
  AND changed_at >= v_week_ago;
  
  -- CHECK 3: Mass cancellations (> 5 in a week)
  IF v_week_cancellations > 5 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.subscription_alerts
      WHERE alert_type = 'mass_cancellations'
      AND period_start = v_week_ago
      AND period_end = CURRENT_DATE
    ) INTO v_alert_exists;
    
    IF NOT v_alert_exists THEN
      INSERT INTO public.subscription_alerts (
        alert_type, severity, metric_value, threshold_value,
        period_start, period_end, details
      ) VALUES (
        'mass_cancellations',
        CASE WHEN v_week_cancellations > 10 THEN 'critical' ELSE 'warning' END,
        v_week_cancellations,
        5.00,
        v_week_ago,
        CURRENT_DATE,
        jsonb_build_object(
          'cancellations_count', v_week_cancellations
        )
      );
      
      RETURN QUERY SELECT 
        'mass_cancellations'::TEXT,
        CASE WHEN v_week_cancellations > 10 THEN 'critical' ELSE 'warning' END::TEXT,
        v_week_cancellations::DECIMAL(10,2),
        5.00::DECIMAL(10,2),
        format('%s cancelaciones en los últimos 7 días', v_week_cancellations)::TEXT;
    END IF;
  END IF;
  
  RETURN;
END;
$$;

-- Fix get_granada_subscription_analytics function: sp.price -> sp.price_monthly/price_yearly
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

  -- Calcular MRR (FIXED: price_monthly/price_yearly instead of price)
  SELECT COALESCE(SUM(
    CASE 
      WHEN ts.billing_cycle = 'monthly' THEN sp.price_monthly
      WHEN ts.billing_cycle = 'annual' THEN sp.price_yearly / 12.0
      ELSE 0
    END
  ), 0)
  INTO v_mrr_total
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.status IN ('active', 'trial');

  -- ARR = MRR * 12
  v_arr_total := v_mrr_total * 12;

  -- MRR del mes pasado (FIXED: price_monthly/price_yearly instead of price)
  SELECT COALESCE(SUM(
    CASE 
      WHEN ts.billing_cycle = 'monthly' THEN sp.price_monthly
      WHEN ts.billing_cycle = 'annual' THEN sp.price_yearly / 12.0
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

  -- Churn rate
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
      'mrr', v_mrr_total,
      'arr', v_arr_total,
      'growth_rate', v_growth_rate,
      'churn_rate', v_churn_rate,
      'new_subscriptions_month', v_new_subs_month,
      'cancelled_subscriptions_month', v_cancelled_subs_month
    ),
    'temporal_evolution', (
      SELECT COALESCE(jsonb_agg(month_data ORDER BY month), '[]'::jsonb)
      FROM (
        SELECT 
          DATE_TRUNC('month', ts.created_at) as month,
          COUNT(*) FILTER (WHERE ts.status = 'active') as active_count,
          COUNT(*) FILTER (WHERE ts.status = 'trial') as trial_count,
          COALESCE(SUM(
            CASE 
              WHEN ts.billing_cycle = 'monthly' THEN sp.price_monthly
              WHEN ts.billing_cycle = 'annual' THEN sp.price_yearly / 12.0
              ELSE 0
            END
          ) FILTER (WHERE ts.status IN ('active', 'trial')), 0) as mrr
        FROM tenant_subscriptions ts
        JOIN subscription_plans sp ON sp.id = ts.plan_id
        WHERE ts.created_at >= v_start_date
        GROUP BY DATE_TRUNC('month', ts.created_at)
      ) month_data
    ),
    'billing_distribution', (
      SELECT jsonb_build_object(
        'ars_monthly', COALESCE(COUNT(*) FILTER (WHERE billing_cycle = 'monthly' AND currency = 'ARS'), 0),
        'ars_annual', COALESCE(COUNT(*) FILTER (WHERE billing_cycle = 'annual' AND currency = 'ARS'), 0),
        'usd_monthly', COALESCE(COUNT(*) FILTER (WHERE billing_cycle = 'monthly' AND currency = 'USD'), 0),
        'usd_annual', COALESCE(COUNT(*) FILTER (WHERE billing_cycle = 'annual' AND currency = 'USD'), 0)
      )
      FROM tenant_subscriptions
      WHERE status IN ('active', 'trial')
    ),
    'plan_distribution', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'plan_name', sp.name,
          'count', COUNT(*)
        )
      ), '[]'::jsonb)
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON sp.id = ts.plan_id
      WHERE ts.status IN ('active', 'trial')
      GROUP BY sp.name
    )
  );

  RETURN v_result;
END;
$$;