-- Create function to get historical commission data by month
CREATE OR REPLACE FUNCTION get_tenant_commission_history(
  p_tenant_id UUID,
  p_months_back INTEGER DEFAULT 12
)
RETURNS TABLE (
  period_month DATE,
  total_commission_ars NUMERIC,
  commission_with_contract NUMERIC,
  commission_without_contract NUMERIC,
  properties_with_contract INTEGER,
  properties_without_contract INTEGER,
  avg_commission_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE months AS (
    SELECT 
      DATE_TRUNC('month', CURRENT_DATE)::DATE as month_date,
      0 as month_offset
    UNION ALL
    SELECT 
      (DATE_TRUNC('month', CURRENT_DATE) - (month_offset + 1 || ' months')::INTERVAL)::DATE,
      month_offset + 1
    FROM months
    WHERE month_offset < p_months_back - 1
  ),
  monthly_data AS (
    SELECT 
      m.month_date,
      p.id as property_id,
      p.admin_commission_percentage,
      p.admin_commission_fixed_amount,
      c.id as contract_id,
      c.monthly_rent,
      c.currency,
      CASE 
        WHEN c.id IS NOT NULL THEN true
        ELSE false
      END as has_contract
    FROM months m
    CROSS JOIN pms_properties p
    LEFT JOIN pms_contracts c ON (
      c.property_id = p.id 
      AND c.status = 'active'
      AND c.start_date <= (m.month_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE
      AND c.end_date >= m.month_date
    )
    WHERE p.tenant_id = p_tenant_id
      AND p.status IN ('available', 'rented', 'maintenance')
      AND p.created_at <= (m.month_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE
  ),
  latest_usd_rate AS (
    SELECT 
      DATE_TRUNC('month', date)::DATE as month_date,
      AVG(rate) as avg_rate
    FROM pms_exchange_rates 
    WHERE currency = 'USD'
    GROUP BY DATE_TRUNC('month', date)
  )
  SELECT 
    md.month_date,
    SUM(
      CASE 
        WHEN md.has_contract AND md.currency = 'USD'
        THEN (md.monthly_rent * COALESCE(md.admin_commission_percentage, 10.00) / 100) * 
             COALESCE(r.avg_rate, 1000)
        WHEN md.has_contract AND md.currency = 'ARS'
        THEN md.monthly_rent * COALESCE(md.admin_commission_percentage, 10.00) / 100
        ELSE COALESCE(md.admin_commission_fixed_amount, 50000.00)
      END
    )::NUMERIC as total_commission_ars,
    SUM(
      CASE 
        WHEN md.has_contract AND md.currency = 'USD'
        THEN (md.monthly_rent * COALESCE(md.admin_commission_percentage, 10.00) / 100) * 
             COALESCE(r.avg_rate, 1000)
        WHEN md.has_contract AND md.currency = 'ARS'
        THEN md.monthly_rent * COALESCE(md.admin_commission_percentage, 10.00) / 100
        ELSE 0
      END
    )::NUMERIC as commission_with_contract,
    SUM(
      CASE 
        WHEN NOT md.has_contract
        THEN COALESCE(md.admin_commission_fixed_amount, 50000.00)
        ELSE 0
      END
    )::NUMERIC as commission_without_contract,
    COUNT(DISTINCT CASE WHEN md.has_contract THEN md.property_id END)::INTEGER as properties_with_contract,
    COUNT(DISTINCT CASE WHEN NOT md.has_contract THEN md.property_id END)::INTEGER as properties_without_contract,
    AVG(CASE WHEN md.has_contract THEN md.admin_commission_percentage END)::NUMERIC as avg_commission_percentage
  FROM monthly_data md
  LEFT JOIN latest_usd_rate r ON r.month_date = md.month_date
  GROUP BY md.month_date
  ORDER BY md.month_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tenant_commission_history(UUID, INTEGER) TO authenticated;