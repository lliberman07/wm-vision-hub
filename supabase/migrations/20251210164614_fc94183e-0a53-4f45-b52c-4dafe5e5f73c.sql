-- Eliminar funciones existentes para evitar conflictos de firma
DROP FUNCTION IF EXISTS get_tenant_commission_report(uuid);
DROP FUNCTION IF EXISTS get_tenant_commission_history(uuid, integer);
DROP FUNCTION IF EXISTS get_tenant_commission_history(uuid, date, date);
DROP FUNCTION IF EXISTS get_tenant_annual_commission_projection(uuid);

-- ============================================
-- FUNCIÓN 1: get_tenant_commission_report
-- Reporte actual de comisiones por propiedad
-- ============================================
CREATE OR REPLACE FUNCTION get_tenant_commission_report(p_tenant_id uuid)
RETURNS TABLE(
  property_id uuid,
  property_code text,
  property_address text,
  property_status text,
  has_active_contract boolean,
  contract_id uuid,
  contract_number text,
  monthly_rent numeric,
  rent_currency text,
  commission_type text,
  commission_value numeric,
  commission_amount_ars numeric,
  is_within_subscription_limit boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_property_limit integer;
  v_property_count integer := 0;
BEGIN
  -- Obtener límite de propiedades del plan de suscripción
  SELECT COALESCE(MAX(sp.max_properties), 9999)
  INTO v_property_limit
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.tenant_id = p_tenant_id
    AND ts.status IN ('active', 'trial');

  RETURN QUERY
  WITH property_commissions AS (
    SELECT 
      p.id as prop_id,
      COALESCE(p.code, p.id::text) as prop_code,
      COALESCE(p.alias, p.address, 'Sin dirección') as prop_address,
      p.status::text as prop_status,
      -- Verificar si tiene contrato activo
      EXISTS (
        SELECT 1 FROM pms_contracts c 
        WHERE c.property_id = p.id 
          AND c.status = 'active'
          AND c.start_date <= CURRENT_DATE
          AND c.end_date >= CURRENT_DATE
      ) as has_contract,
      -- Datos del contrato activo
      (
        SELECT c.id FROM pms_contracts c 
        WHERE c.property_id = p.id 
          AND c.status = 'active'
          AND c.start_date <= CURRENT_DATE
          AND c.end_date >= CURRENT_DATE
        ORDER BY c.created_at DESC LIMIT 1
      ) as active_contract_id,
      (
        SELECT c.contract_number FROM pms_contracts c 
        WHERE c.property_id = p.id 
          AND c.status = 'active'
          AND c.start_date <= CURRENT_DATE
          AND c.end_date >= CURRENT_DATE
        ORDER BY c.created_at DESC LIMIT 1
      ) as active_contract_number,
      -- Monto mensual del contrato
      (
        SELECT COALESCE(c.monthly_rent, c.monto_a + COALESCE(c.monto_b, 0), 0) 
        FROM pms_contracts c 
        WHERE c.property_id = p.id 
          AND c.status = 'active'
          AND c.start_date <= CURRENT_DATE
          AND c.end_date >= CURRENT_DATE
        ORDER BY c.created_at DESC LIMIT 1
      ) as contract_rent,
      -- Moneda del contrato
      (
        SELECT COALESCE(c.currency, 'ARS') FROM pms_contracts c 
        WHERE c.property_id = p.id 
          AND c.status = 'active'
          AND c.start_date <= CURRENT_DATE
          AND c.end_date >= CURRENT_DATE
        ORDER BY c.created_at DESC LIMIT 1
      ) as contract_currency,
      -- CORREGIDO: Usar admin_commission_percentage (antes: admin_commission_rate)
      COALESCE(p.admin_commission_percentage, 0) as comm_percentage,
      -- CORREGIDO: Usar admin_commission_fixed_amount (antes: fixed_monthly_fee)
      COALESCE(p.admin_commission_fixed_amount, 0) as comm_fixed,
      ROW_NUMBER() OVER (ORDER BY p.created_at) as row_num
    FROM pms_properties p
    WHERE p.tenant_id = p_tenant_id
      -- CORREGIDO: Usar 'active' en lugar de 'available'
      AND p.status IN ('active', 'rented', 'maintenance')
  )
  SELECT 
    pc.prop_id,
    pc.prop_code,
    pc.prop_address,
    pc.prop_status,
    pc.has_contract,
    pc.active_contract_id,
    pc.active_contract_number,
    COALESCE(pc.contract_rent, 0)::numeric,
    COALESCE(pc.contract_currency, 'ARS'),
    -- Tipo de comisión: porcentual si tiene contrato, fijo si no
    CASE 
      WHEN pc.has_contract AND pc.comm_percentage > 0 THEN 'percentage'
      ELSE 'fixed'
    END,
    -- Valor de la comisión
    CASE 
      WHEN pc.has_contract AND pc.comm_percentage > 0 THEN pc.comm_percentage
      ELSE pc.comm_fixed
    END,
    -- Monto de comisión en ARS
    CASE 
      WHEN pc.has_contract AND pc.comm_percentage > 0 
        THEN ROUND((COALESCE(pc.contract_rent, 0) * pc.comm_percentage / 100)::numeric, 2)
      ELSE pc.comm_fixed
    END,
    -- Si está dentro del límite del plan
    pc.row_num <= v_property_limit
  FROM property_commissions pc
  ORDER BY pc.has_contract DESC, pc.prop_code;
END;
$$;

-- ============================================
-- FUNCIÓN 2: get_tenant_commission_history
-- Historial de comisiones por período
-- ============================================
CREATE OR REPLACE FUNCTION get_tenant_commission_history(
  p_tenant_id uuid,
  p_months_back integer DEFAULT 6
)
RETURNS TABLE(
  period_month text,
  total_commission_ars numeric,
  commission_with_contract numeric,
  commission_without_contract numeric,
  properties_with_contract integer,
  properties_without_contract integer,
  avg_commission_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      DATE_TRUNC('month', CURRENT_DATE) - ((p_months_back - 1) || ' months')::interval,
      DATE_TRUNC('month', CURRENT_DATE),
      '1 month'::interval
    )::date as month_start
  ),
  monthly_data AS (
    SELECT 
      m.month_start,
      -- Propiedades con contrato activo en ese mes
      COUNT(DISTINCT CASE 
        WHEN EXISTS (
          SELECT 1 FROM pms_contracts c 
          WHERE c.property_id = p.id 
            AND c.status = 'active'
            AND c.start_date <= (m.month_start + interval '1 month' - interval '1 day')::date
            AND c.end_date >= m.month_start
        ) THEN p.id 
      END) as props_with_contract,
      -- Propiedades sin contrato activo en ese mes
      COUNT(DISTINCT CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM pms_contracts c 
          WHERE c.property_id = p.id 
            AND c.status = 'active'
            AND c.start_date <= (m.month_start + interval '1 month' - interval '1 day')::date
            AND c.end_date >= m.month_start
        ) THEN p.id 
      END) as props_without_contract,
      -- Comisión de propiedades con contrato (porcentual)
      COALESCE(SUM(CASE 
        WHEN EXISTS (
          SELECT 1 FROM pms_contracts c 
          WHERE c.property_id = p.id 
            AND c.status = 'active'
            AND c.start_date <= (m.month_start + interval '1 month' - interval '1 day')::date
            AND c.end_date >= m.month_start
        ) THEN (
          SELECT ROUND((COALESCE(c.monthly_rent, c.monto_a + COALESCE(c.monto_b, 0), 0) * COALESCE(p.admin_commission_percentage, 0) / 100)::numeric, 2)
          FROM pms_contracts c 
          WHERE c.property_id = p.id 
            AND c.status = 'active'
            AND c.start_date <= (m.month_start + interval '1 month' - interval '1 day')::date
            AND c.end_date >= m.month_start
          LIMIT 1
        )
        ELSE 0
      END), 0) as comm_with_contract,
      -- Comisión de propiedades sin contrato (fijo)
      COALESCE(SUM(CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM pms_contracts c 
          WHERE c.property_id = p.id 
            AND c.status = 'active'
            AND c.start_date <= (m.month_start + interval '1 month' - interval '1 day')::date
            AND c.end_date >= m.month_start
        ) THEN COALESCE(p.admin_commission_fixed_amount, 0)
        ELSE 0
      END), 0) as comm_without_contract,
      -- Promedio de porcentaje de comisión
      COALESCE(AVG(CASE 
        WHEN COALESCE(p.admin_commission_percentage, 0) > 0 
        THEN p.admin_commission_percentage 
      END), 0) as avg_percentage
    FROM months m
    CROSS JOIN pms_properties p
    WHERE p.tenant_id = p_tenant_id
      AND p.status IN ('active', 'rented', 'maintenance')
    GROUP BY m.month_start
  )
  SELECT 
    TO_CHAR(md.month_start, 'YYYY-MM') as period_month,
    ROUND((md.comm_with_contract + md.comm_without_contract)::numeric, 2) as total_commission_ars,
    ROUND(md.comm_with_contract::numeric, 2) as commission_with_contract,
    ROUND(md.comm_without_contract::numeric, 2) as commission_without_contract,
    md.props_with_contract::integer as properties_with_contract,
    md.props_without_contract::integer as properties_without_contract,
    ROUND(md.avg_percentage::numeric, 2) as avg_commission_percentage
  FROM monthly_data md
  ORDER BY md.month_start DESC;
END;
$$;

-- ============================================
-- FUNCIÓN 3: get_tenant_annual_commission_projection
-- Proyección anual de comisiones
-- ============================================
CREATE OR REPLACE FUNCTION get_tenant_annual_commission_projection(p_tenant_id uuid)
RETURNS TABLE(
  total_projection numeric,
  from_active_contracts numeric,
  from_properties_without_contract numeric,
  active_contracts_count integer,
  properties_without_contract_count integer,
  avg_monthly_commission numeric,
  projection_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contracts_projection numeric := 0;
  v_available_projection numeric := 0;
  v_contracts_count integer := 0;
  v_available_count integer := 0;
  v_details jsonb;
BEGIN
  -- Calcular proyección de contratos activos
  SELECT 
    COALESCE(SUM(
      -- Comisión mensual * meses restantes del contrato
      ROUND((COALESCE(c.monthly_rent, c.monto_a + COALESCE(c.monto_b, 0), 0) * COALESCE(p.admin_commission_percentage, 0) / 100)::numeric, 2)
      * GREATEST(1, EXTRACT(MONTH FROM AGE(c.end_date, CURRENT_DATE)) + 1)
    ), 0),
    COUNT(DISTINCT c.id)
  INTO v_contracts_projection, v_contracts_count
  FROM pms_contracts c
  JOIN pms_properties p ON p.id = c.property_id
  WHERE c.tenant_id = p_tenant_id
    AND c.status = 'active'
    AND c.start_date <= CURRENT_DATE
    AND c.end_date >= CURRENT_DATE
    AND COALESCE(p.admin_commission_percentage, 0) > 0;

  -- Calcular proyección de propiedades sin contrato
  SELECT 
    COALESCE(SUM(COALESCE(p.admin_commission_fixed_amount, 0) * 12), 0),
    COUNT(*)
  INTO v_available_projection, v_available_count
  FROM pms_properties p
  WHERE p.tenant_id = p_tenant_id
    AND p.status IN ('active', 'rented', 'maintenance')
    AND COALESCE(p.admin_commission_fixed_amount, 0) > 0
    AND NOT EXISTS (
      SELECT 1 FROM pms_contracts c 
      WHERE c.property_id = p.id 
        AND c.status = 'active'
        AND c.start_date <= CURRENT_DATE
        AND c.end_date >= CURRENT_DATE
    );

  -- Construir detalles
  v_details := jsonb_build_object(
    'contracts', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'contract_id', c.id,
        'contract_number', c.contract_number,
        'property_code', COALESCE(p.code, p.id::text),
        'monthly_commission', ROUND((COALESCE(c.monthly_rent, c.monto_a + COALESCE(c.monto_b, 0), 0) * COALESCE(p.admin_commission_percentage, 0) / 100)::numeric, 2),
        'months_remaining', GREATEST(1, EXTRACT(MONTH FROM AGE(c.end_date, CURRENT_DATE)) + 1),
        'end_date', c.end_date
      )), '[]'::jsonb)
      FROM pms_contracts c
      JOIN pms_properties p ON p.id = c.property_id
      WHERE c.tenant_id = p_tenant_id
        AND c.status = 'active'
        AND c.start_date <= CURRENT_DATE
        AND c.end_date >= CURRENT_DATE
        AND COALESCE(p.admin_commission_percentage, 0) > 0
    ),
    'available_properties', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'property_id', p.id,
        'property_code', COALESCE(p.code, p.id::text),
        'fixed_fee', COALESCE(p.admin_commission_fixed_amount, 0)
      )), '[]'::jsonb)
      FROM pms_properties p
      WHERE p.tenant_id = p_tenant_id
        AND p.status IN ('active', 'rented', 'maintenance')
        AND COALESCE(p.admin_commission_fixed_amount, 0) > 0
        AND NOT EXISTS (
          SELECT 1 FROM pms_contracts c 
          WHERE c.property_id = p.id 
            AND c.status = 'active'
            AND c.start_date <= CURRENT_DATE
            AND c.end_date >= CURRENT_DATE
        )
    )
  );

  RETURN QUERY SELECT 
    ROUND((v_contracts_projection + v_available_projection)::numeric, 2),
    ROUND(v_contracts_projection::numeric, 2),
    ROUND(v_available_projection::numeric, 2),
    v_contracts_count,
    v_available_count,
    ROUND(((v_contracts_projection + v_available_projection) / 12)::numeric, 2),
    v_details;
END;
$$;