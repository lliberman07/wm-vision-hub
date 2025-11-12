-- Create table for subscription alerts
CREATE TABLE IF NOT EXISTS public.subscription_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('high_churn_rate', 'mrr_drop', 'mass_cancellations')),
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  metric_value DECIMAL(10,2) NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  details JSONB,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for Granada admins to view alerts (using existing function)
CREATE POLICY "Granada admins can view subscription alerts"
ON public.subscription_alerts
FOR SELECT
USING (is_granada_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_alerts_created_at ON public.subscription_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_alerts_type ON public.subscription_alerts(alert_type);

-- Function to check and create subscription alerts
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
  
  -- Calculate cancellations this month
  SELECT COUNT(*)
  INTO v_current_month_cancellations
  FROM public.subscription_change_history
  WHERE change_type = 'cancellation'
  AND change_date >= v_current_month_start
  AND change_date <= v_current_month_end;
  
  -- Calculate churn rate
  IF v_current_active > 0 THEN
    v_churn_rate := (v_current_month_cancellations::DECIMAL / v_current_active::DECIMAL) * 100;
  ELSE
    v_churn_rate := 0;
  END IF;
  
  -- CHECK 1: High churn rate (> 15%)
  IF v_churn_rate > 15 THEN
    -- Check if alert already exists for this period
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
  
  -- Calculate current MRR
  SELECT COALESCE(SUM(
    CASE 
      WHEN sp.billing_cycle = 'monthly' THEN sp.price
      WHEN sp.billing_cycle = 'annual' THEN sp.price / 12
    END
  ), 0)
  INTO v_current_mrr
  FROM public.tenant_subscriptions ts
  JOIN public.subscription_plans sp ON ts.plan_id = sp.id
  WHERE ts.status = 'active';
  
  -- Calculate last month MRR
  SELECT COALESCE(SUM(
    CASE 
      WHEN sp.billing_cycle = 'monthly' THEN sp.price
      WHEN sp.billing_cycle = 'annual' THEN sp.price / 12
    END
  ), 0)
  INTO v_last_mrr
  FROM public.tenant_subscriptions ts
  JOIN public.subscription_plans sp ON ts.plan_id = sp.id
  WHERE ts.status = 'active'
  OR (ts.status = 'cancelled' AND ts.end_date >= v_last_month_end);
  
  -- Calculate MRR change percentage
  IF v_last_mrr > 0 THEN
    v_mrr_change_pct := ((v_current_mrr - v_last_mrr) / v_last_mrr) * 100;
  ELSE
    v_mrr_change_pct := 0;
  END IF;
  
  -- CHECK 2: MRR drop > 10%
  IF v_mrr_change_pct < -10 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.subscription_alerts
      WHERE alert_type = 'mrr_drop'
      AND period_start = v_last_month_start
      AND period_end = v_current_month_end
    ) INTO v_alert_exists;
    
    IF NOT v_alert_exists THEN
      INSERT INTO public.subscription_alerts (
        alert_type, severity, metric_value, threshold_value,
        period_start, period_end, details
      ) VALUES (
        'mrr_drop',
        CASE WHEN v_mrr_change_pct < -20 THEN 'critical' ELSE 'warning' END,
        ABS(v_mrr_change_pct),
        10.00,
        v_last_month_start,
        v_current_month_end,
        jsonb_build_object(
          'current_mrr', v_current_mrr,
          'last_mrr', v_last_mrr,
          'change_amount', v_current_mrr - v_last_mrr
        )
      );
      
      RETURN QUERY SELECT 
        'mrr_drop'::TEXT,
        CASE WHEN v_mrr_change_pct < -20 THEN 'critical' ELSE 'warning' END::TEXT,
        ABS(v_mrr_change_pct),
        10.00::DECIMAL(10,2),
        format('MRR cayó %s%% (de $%s a $%s)', ROUND(ABS(v_mrr_change_pct), 2), ROUND(v_last_mrr, 2), ROUND(v_current_mrr, 2))::TEXT;
    END IF;
  END IF;
  
  -- CHECK 3: More than 5 cancellations in last 7 days
  SELECT COUNT(*)
  INTO v_week_cancellations
  FROM public.subscription_change_history
  WHERE change_type = 'cancellation'
  AND change_date >= v_week_ago;
  
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
          'cancellations', v_week_cancellations,
          'period_days', 7
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