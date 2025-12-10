-- Primero eliminar las funciones existentes
DROP FUNCTION IF EXISTS public.get_tenant_commission_report(uuid);
DROP FUNCTION IF EXISTS public.get_tenant_commission_history(uuid, date, date);
DROP FUNCTION IF EXISTS public.get_tenant_annual_commission_projection(uuid);

-- Recrear get_tenant_commission_report con 'active' en lugar de 'available'
CREATE OR REPLACE FUNCTION public.get_tenant_commission_report(p_tenant_id uuid)
RETURNS TABLE(
  property_id uuid,
  property_code text,
  property_address text,
  property_status text,
  has_active_contract boolean,
  contract_id uuid,
  monthly_rent numeric,
  currency text,
  commission_type text,
  commission_rate numeric,
  fixed_commission numeric,
  calculated_commission numeric,
  owner_names text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH property_owners AS (
    SELECT 
      op.property_id,
      string_agg(DISTINCT o.full_name, ', ') as owner_names
    FROM pms_owner_properties op
    JOIN pms_owners o ON o.id = op.owner_id
    WHERE op.tenant_id = p_tenant_id
      AND (op.end_date IS NULL OR op.end_date > CURRENT_DATE)
    GROUP BY op.property_id
  ),
  active_contracts AS (
    SELECT DISTINCT ON (c.property_id)
      c.property_id,
      c.id as contract_id,
      COALESCE(c.monto_a, 0) + COALESCE(c.monto_b, 0) as monthly_rent,
      COALESCE(c.currency, 'ARS') as currency
    FROM pms_contracts c
    WHERE c.tenant_id = p_tenant_id
      AND c.status = 'active'
    ORDER BY c.property_id, c.start_date DESC
  )
  SELECT 
    p.id as property_id,
    p.code as property_code,
    p.address as property_address,
    p.status as property_status,
    (ac.contract_id IS NOT NULL) as has_active_contract,
    ac.contract_id,
    COALESCE(ac.monthly_rent, 0::numeric) as monthly_rent,
    COALESCE(ac.currency, 'ARS') as currency,
    CASE 
      WHEN ac.contract_id IS NOT NULL THEN 'percentage'
      ELSE 'fixed'
    END as commission_type,
    COALESCE(p.admin_commission_rate, 0) as commission_rate,
    COALESCE(p.fixed_monthly_commission, 0) as fixed_commission,
    CASE 
      WHEN ac.contract_id IS NOT NULL THEN 
        ROUND(COALESCE(ac.monthly_rent, 0) * COALESCE(p.admin_commission_rate, 0) / 100, 2)
      ELSE 
        COALESCE(p.fixed_monthly_commission, 0)
    END as calculated_commission,
    COALESCE(po.owner_names, '') as owner_names
  FROM pms_properties p
  LEFT JOIN active_contracts ac ON ac.property_id = p.id
  LEFT JOIN property_owners po ON po.property_id = p.id
  WHERE p.tenant_id = p_tenant_id
    AND p.status IN ('active', 'rented', 'maintenance')
  ORDER BY p.code;
END;
$$;

-- Recrear get_tenant_commission_history con 'active' en lugar de 'available'
CREATE OR REPLACE FUNCTION public.get_tenant_commission_history(
  p_tenant_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE(
  period_month date,
  property_id uuid,
  property_code text,
  contract_id uuid,
  commission_type text,
  commission_amount numeric,
  currency text,
  payment_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT 
      COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')::date) as start_dt,
      COALESCE(p_end_date, DATE_TRUNC('month', CURRENT_DATE)::date) as end_dt
  ),
  months AS (
    SELECT generate_series(
      (SELECT start_dt FROM date_range),
      (SELECT end_dt FROM date_range),
      '1 month'::interval
    )::date as month_start
  ),
  property_commissions AS (
    SELECT 
      m.month_start,
      p.id as property_id,
      p.code as property_code,
      c.id as contract_id,
      CASE 
        WHEN c.id IS NOT NULL THEN 'percentage'
        ELSE 'fixed'
      END as commission_type,
      CASE 
        WHEN c.id IS NOT NULL THEN 
          ROUND((COALESCE(c.monto_a, 0) + COALESCE(c.monto_b, 0)) * COALESCE(p.admin_commission_rate, 0) / 100, 2)
        ELSE 
          COALESCE(p.fixed_monthly_commission, 0)
      END as commission_amount,
      COALESCE(c.currency, 'ARS') as currency,
      'calculated' as payment_status
    FROM months m
    CROSS JOIN pms_properties p
    LEFT JOIN pms_contracts c ON c.property_id = p.id
      AND c.tenant_id = p_tenant_id
      AND c.status = 'active'
      AND c.start_date <= (m.month_start + INTERVAL '1 month - 1 day')::date
      AND c.end_date >= m.month_start
    WHERE p.tenant_id = p_tenant_id
      AND p.status IN ('active', 'rented', 'maintenance')
  )
  SELECT 
    pc.month_start as period_month,
    pc.property_id,
    pc.property_code,
    pc.contract_id,
    pc.commission_type,
    pc.commission_amount,
    pc.currency,
    pc.payment_status
  FROM property_commissions pc
  WHERE pc.commission_amount > 0
  ORDER BY pc.month_start DESC, pc.property_code;
END;
$$;

-- Recrear get_tenant_annual_commission_projection con 'active' en lugar de 'available'
CREATE OR REPLACE FUNCTION public.get_tenant_annual_commission_projection(p_tenant_id uuid)
RETURNS TABLE(
  projection_month date,
  total_commission numeric,
  with_contract_commission numeric,
  without_contract_commission numeric,
  properties_with_contract integer,
  properties_without_contract integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      DATE_TRUNC('month', CURRENT_DATE)::date,
      (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 months')::date,
      '1 month'::interval
    )::date as month_start
  ),
  monthly_data AS (
    SELECT 
      m.month_start,
      p.id as property_id,
      CASE 
        WHEN c.id IS NOT NULL THEN 
          ROUND((COALESCE(c.monto_a, 0) + COALESCE(c.monto_b, 0)) * COALESCE(p.admin_commission_rate, 0) / 100, 2)
        ELSE 0
      END as contract_commission,
      CASE 
        WHEN c.id IS NULL THEN COALESCE(p.fixed_monthly_commission, 0)
        ELSE 0
      END as fixed_commission,
      (c.id IS NOT NULL) as has_contract
    FROM months m
    CROSS JOIN pms_properties p
    LEFT JOIN pms_contracts c ON c.property_id = p.id
      AND c.tenant_id = p_tenant_id
      AND c.status = 'active'
      AND c.start_date <= (m.month_start + INTERVAL '1 month - 1 day')::date
      AND c.end_date >= m.month_start
    WHERE p.tenant_id = p_tenant_id
      AND p.status IN ('active', 'rented', 'maintenance')
  )
  SELECT 
    md.month_start as projection_month,
    SUM(md.contract_commission + md.fixed_commission) as total_commission,
    SUM(md.contract_commission) as with_contract_commission,
    SUM(md.fixed_commission) as without_contract_commission,
    COUNT(*) FILTER (WHERE md.has_contract)::integer as properties_with_contract,
    COUNT(*) FILTER (WHERE NOT md.has_contract)::integer as properties_without_contract
  FROM monthly_data md
  GROUP BY md.month_start
  ORDER BY md.month_start;
END;
$$;