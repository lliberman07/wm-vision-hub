-- =====================================================
-- Fix: Add search_path to SECURITY DEFINER functions
-- This prevents search path injection attacks
-- =====================================================

-- 1. Fix check_subscription_alerts
CREATE OR REPLACE FUNCTION public.check_subscription_alerts()
 RETURNS TABLE(alert_type text, severity text, metric_value numeric, threshold_value numeric, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
  SELECT COUNT(*)
  INTO v_current_active
  FROM public.tenant_subscriptions
  WHERE status = 'active';
  
  SELECT COUNT(*)
  INTO v_current_month_cancellations
  FROM public.subscription_change_history
  WHERE change_type = 'cancellation'
  AND changed_at >= v_current_month_start
  AND changed_at <= v_current_month_end;
  
  IF v_current_active > 0 THEN
    v_churn_rate := (v_current_month_cancellations::DECIMAL / v_current_active::DECIMAL) * 100;
  ELSE
    v_churn_rate := 0;
  END IF;
  
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
  
  SELECT COALESCE(SUM(
    CASE 
      WHEN ts.billing_cycle = 'monthly' THEN sp.price_monthly
      WHEN ts.billing_cycle = 'yearly' THEN sp.price_yearly / 12.0
      ELSE 0
    END
  ), 0)
  INTO v_current_mrr
  FROM public.tenant_subscriptions ts
  JOIN public.subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.status IN ('active', 'trial');
  
  SELECT COALESCE(SUM(
    CASE 
      WHEN ts.billing_cycle = 'monthly' THEN sp.price_monthly
      WHEN ts.billing_cycle = 'yearly' THEN sp.price_yearly / 12.0
      ELSE 0
    END
  ), 0)
  INTO v_last_mrr
  FROM public.tenant_subscriptions ts
  JOIN public.subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.status IN ('active', 'trial')
  AND ts.created_at < v_current_month_start;
  
  IF v_last_mrr > 0 THEN
    v_mrr_change_pct := ((v_current_mrr - v_last_mrr) / v_last_mrr) * 100;
  ELSE
    v_mrr_change_pct := 0;
  END IF;
  
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
        format('MRR cayó %s%% (umbral: 20%%)', ABS(v_mrr_change_pct))::TEXT;
    END IF;
  END IF;
  
  SELECT COUNT(*)
  INTO v_week_cancellations
  FROM public.subscription_change_history
  WHERE change_type = 'cancellation'
  AND changed_at >= v_week_ago;
  
  IF v_week_cancellations >= 3 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.subscription_alerts
      WHERE alert_type = 'cancellation_spike'
      AND created_at >= v_week_ago
    ) INTO v_alert_exists;
    
    IF NOT v_alert_exists THEN
      INSERT INTO public.subscription_alerts (
        alert_type, severity, metric_value, threshold_value,
        period_start, period_end, details
      ) VALUES (
        'cancellation_spike',
        CASE WHEN v_week_cancellations >= 5 THEN 'critical' ELSE 'warning' END,
        v_week_cancellations,
        3,
        v_week_ago,
        CURRENT_DATE,
        jsonb_build_object('cancellations_last_7_days', v_week_cancellations)
      );
      
      RETURN QUERY SELECT 
        'cancellation_spike'::TEXT,
        CASE WHEN v_week_cancellations >= 5 THEN 'critical' ELSE 'warning' END::TEXT,
        v_week_cancellations::DECIMAL(10,2),
        3.00::DECIMAL(10,2),
        format('%s cancelaciones en los últimos 7 días', v_week_cancellations)::TEXT;
    END IF;
  END IF;
  
  RETURN;
END;
$function$;

-- 2. Fix cleanup_old_password_reset_attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_password_reset_attempts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.password_reset_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$function$;

-- 3. Fix deactivate_inquilino_on_contract_end
CREATE OR REPLACE FUNCTION public.deactivate_inquilino_on_contract_end()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- If contract is cancelled or end_date has passed
  IF (NEW.status = 'cancelled' OR NEW.end_date < CURRENT_DATE) 
     AND (OLD.status != 'cancelled' AND OLD.end_date >= CURRENT_DATE) THEN
    UPDATE pms_client_users
    SET is_active = false,
        deactivated_at = now()
    WHERE contract_id = NEW.id
      AND user_type = 'INQUILINO';
  END IF;
  
  RETURN NEW;
END;
$function$;