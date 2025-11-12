-- Add commission tracking fields to pms_properties
ALTER TABLE pms_properties 
ADD COLUMN IF NOT EXISTS admin_commission_percentage NUMERIC(5,2) DEFAULT 10.00
  CHECK (admin_commission_percentage >= 0 AND admin_commission_percentage <= 100);

ALTER TABLE pms_properties 
ADD COLUMN IF NOT EXISTS admin_commission_fixed_amount NUMERIC(10,2) DEFAULT 50000.00
  CHECK (admin_commission_fixed_amount >= 0);

COMMENT ON COLUMN pms_properties.admin_commission_percentage IS 
  'Porcentaje de comisión sobre renta mensual cuando hay contrato activo (ej: 10% = 10.00)';

COMMENT ON COLUMN pms_properties.admin_commission_fixed_amount IS 
  'Monto fijo en ARS por administración cuando NO hay contrato activo';

-- Create function to get commission report for tenants
CREATE OR REPLACE FUNCTION get_tenant_commission_report(p_tenant_id UUID)
RETURNS TABLE (
  property_id UUID,
  property_code TEXT,
  property_address TEXT,
  property_status TEXT,
  has_active_contract BOOLEAN,
  contract_id UUID,
  contract_number TEXT,
  monthly_rent NUMERIC,
  rent_currency TEXT,
  commission_type TEXT,
  commission_value NUMERIC,
  commission_amount_ars NUMERIC,
  is_within_subscription_limit BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_max_properties INTEGER;
  v_current_property_count INTEGER;
BEGIN
  -- Obtener límite de propiedades del plan de suscripción
  SELECT COALESCE(sp.max_properties, 999999)
  INTO v_max_properties
  FROM tenant_subscriptions ts
  JOIN subscription_plans sp ON sp.id = ts.plan_id
  WHERE ts.tenant_id = p_tenant_id
    AND ts.status = 'active'
  LIMIT 1;

  -- Contar propiedades activas
  SELECT COUNT(*)
  INTO v_current_property_count
  FROM pms_properties
  WHERE tenant_id = p_tenant_id
    AND status IN ('available', 'rented', 'maintenance');

  RETURN QUERY
  WITH active_contracts AS (
    SELECT DISTINCT ON (property_id) 
      property_id,
      id as contract_id,
      contract_number,
      monthly_rent,
      currency,
      status
    FROM pms_contracts
    WHERE status = 'active' 
      AND tenant_id = p_tenant_id
      AND start_date <= CURRENT_DATE 
      AND end_date >= CURRENT_DATE
    ORDER BY property_id, created_at DESC
  ),
  latest_usd_rate AS (
    SELECT rate 
    FROM pms_exchange_rates 
    WHERE currency = 'USD' 
    ORDER BY date DESC 
    LIMIT 1
  )
  SELECT 
    p.id as property_id,
    p.code as property_code,
    p.address as property_address,
    p.status as property_status,
    CASE 
      WHEN ac.contract_id IS NOT NULL THEN true 
      ELSE false 
    END as has_active_contract,
    ac.contract_id,
    ac.contract_number,
    COALESCE(ac.monthly_rent, 0) as monthly_rent,
    COALESCE(ac.currency, 'ARS') as rent_currency,
    CASE 
      WHEN ac.contract_id IS NOT NULL THEN 'percentage'::TEXT
      ELSE 'fixed'::TEXT
    END as commission_type,
    CASE 
      WHEN ac.contract_id IS NOT NULL 
      THEN COALESCE(p.admin_commission_percentage, 10.00)
      ELSE COALESCE(p.admin_commission_fixed_amount, 50000.00)
    END as commission_value,
    CASE 
      WHEN ac.contract_id IS NOT NULL AND ac.currency = 'USD'
      THEN (ac.monthly_rent * COALESCE(p.admin_commission_percentage, 10.00) / 100) * 
           COALESCE((SELECT rate FROM latest_usd_rate), 1000)
      WHEN ac.contract_id IS NOT NULL AND ac.currency = 'ARS'
      THEN ac.monthly_rent * COALESCE(p.admin_commission_percentage, 10.00) / 100
      ELSE COALESCE(p.admin_commission_fixed_amount, 50000.00)
    END as commission_amount_ars,
    (ROW_NUMBER() OVER (ORDER BY p.created_at) <= v_max_properties) as is_within_subscription_limit
  FROM pms_properties p
  LEFT JOIN active_contracts ac ON ac.property_id = p.id
  WHERE p.tenant_id = p_tenant_id
    AND p.status IN ('available', 'rented', 'maintenance')
  ORDER BY has_active_contract DESC, p.code;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tenant_commission_report(UUID) TO authenticated;

-- Update RLS policy for CLIENT_ADMIN to update property commissions
CREATE POLICY "CLIENT_ADMIN can update property commissions"
ON pms_properties
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM pms_client_users 
    WHERE user_id = auth.uid() 
      AND user_type = 'CLIENT_ADMIN'
      AND is_active = true
  )
);