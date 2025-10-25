-- Función para verificar si un tenant tiene registros asociados
CREATE OR REPLACE FUNCTION check_tenant_has_records(tenant_id_param UUID)
RETURNS TABLE (
  has_records BOOLEAN,
  total_records BIGINT,
  details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  properties_count BIGINT;
  contracts_count BIGINT;
  owners_count BIGINT;
  tenants_renters_count BIGINT;
  payments_count BIGINT;
  expenses_count BIGINT;
  user_roles_count BIGINT;
  total BIGINT;
BEGIN
  -- Contar registros en cada tabla relacionada
  SELECT COUNT(*) INTO properties_count 
  FROM pms_properties WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO contracts_count 
  FROM pms_contracts WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO owners_count 
  FROM pms_owners WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO tenants_renters_count 
  FROM pms_tenants_renters WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO payments_count 
  FROM pms_payments WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO expenses_count 
  FROM pms_expenses WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO user_roles_count 
  FROM user_roles WHERE tenant_id = tenant_id_param AND module = 'PMS';
  
  -- Calcular total
  total := properties_count + contracts_count + owners_count + 
           tenants_renters_count + payments_count + expenses_count + user_roles_count;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    total > 0 AS has_records,
    total AS total_records,
    jsonb_build_object(
      'properties', properties_count,
      'contracts', contracts_count,
      'owners', owners_count,
      'tenants_renters', tenants_renters_count,
      'payments', payments_count,
      'expenses', expenses_count,
      'user_roles', user_roles_count
    ) AS details;
END;
$$;