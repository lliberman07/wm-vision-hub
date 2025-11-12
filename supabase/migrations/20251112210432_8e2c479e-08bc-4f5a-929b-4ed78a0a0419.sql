-- Función para calcular proyección anual de comisiones
CREATE OR REPLACE FUNCTION get_tenant_annual_commission_projection(p_tenant_id UUID)
RETURNS TABLE(
  total_projection DECIMAL,
  from_active_contracts DECIMAL,
  from_properties_without_contract DECIMAL,
  active_contracts_count INTEGER,
  properties_without_contract_count INTEGER,
  avg_monthly_commission DECIMAL,
  projection_details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH tenant_commission_config AS (
    SELECT 
      COALESCE(commission_percentage, 0) as rate,
      COALESCE(commission_sin_contrato, 0) as rate_no_contract
    FROM pms_tenants
    WHERE id = p_tenant_id
  ),
  active_contracts AS (
    SELECT 
      c.id,
      c.property_id,
      p.nombre as property_name,
      c.monto_alquiler,
      c.fecha_fin,
      GREATEST(
        EXTRACT(YEAR FROM AGE(c.fecha_fin, CURRENT_DATE)) * 12 + 
        EXTRACT(MONTH FROM AGE(c.fecha_fin, CURRENT_DATE)),
        0
      ) as months_remaining,
      (c.monto_alquiler * (SELECT rate FROM tenant_commission_config) / 100) as monthly_commission
    FROM pms_contratos c
    JOIN pms_propiedades p ON c.property_id = p.id
    WHERE c.tenant_id = p_tenant_id
      AND c.estado = 'activo'
      AND c.fecha_fin >= CURRENT_DATE
  ),
  properties_without_contract AS (
    SELECT 
      p.id,
      p.nombre,
      p.precio_referencia,
      (COALESCE(p.precio_referencia, 0) * (SELECT rate_no_contract FROM tenant_commission_config) / 100) as monthly_commission
    FROM pms_propiedades p
    WHERE p.tenant_id = p_tenant_id
      AND p.estado = 'disponible'
      AND NOT EXISTS (
        SELECT 1 FROM pms_contratos c 
        WHERE c.property_id = p.id 
          AND c.estado = 'activo'
      )
  ),
  contract_projections AS (
    SELECT 
      SUM(monthly_commission * months_remaining) as total_from_contracts,
      COUNT(*) as contracts_count,
      json_agg(
        json_build_object(
          'property_name', property_name,
          'monthly_commission', monthly_commission,
          'months_remaining', months_remaining,
          'total_projection', monthly_commission * months_remaining,
          'end_date', fecha_fin
        )
      ) as contract_details
    FROM active_contracts
  ),
  no_contract_projections AS (
    SELECT 
      SUM(monthly_commission * 12) as total_from_no_contract,
      COUNT(*) as no_contract_count,
      json_agg(
        json_build_object(
          'property_name', nombre,
          'monthly_commission', monthly_commission,
          'annual_potential', monthly_commission * 12,
          'reference_price', precio_referencia
        )
      ) as no_contract_details
    FROM properties_without_contract
  )
  SELECT 
    COALESCE(cp.total_from_contracts, 0) + COALESCE(ncp.total_from_no_contract, 0) as total_projection,
    COALESCE(cp.total_from_contracts, 0) as from_active_contracts,
    COALESCE(ncp.total_from_no_contract, 0) as from_properties_without_contract,
    COALESCE(cp.contracts_count, 0)::INTEGER as active_contracts_count,
    COALESCE(ncp.no_contract_count, 0)::INTEGER as properties_without_contract_count,
    (COALESCE(cp.total_from_contracts, 0) + COALESCE(ncp.total_from_no_contract, 0)) / 12 as avg_monthly_commission,
    json_build_object(
      'active_contracts', COALESCE(cp.contract_details, '[]'::json),
      'properties_without_contract', COALESCE(ncp.no_contract_details, '[]'::json),
      'commission_rate', (SELECT rate FROM tenant_commission_config),
      'commission_sin_contrato', (SELECT rate_no_contract FROM tenant_commission_config),
      'projection_date', CURRENT_DATE
    ) as projection_details
  FROM contract_projections cp
  CROSS JOIN no_contract_projections ncp;
END;
$$;