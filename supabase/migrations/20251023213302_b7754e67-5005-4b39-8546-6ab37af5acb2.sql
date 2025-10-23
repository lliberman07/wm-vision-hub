-- FASE 1: Funciones de validación de códigos case-insensitive

-- validate_property_code: Validación case-insensitive para códigos de propiedades
CREATE OR REPLACE FUNCTION validate_property_code(
  p_code TEXT,
  p_property_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_normalized_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Normalizar: TRIM + UPPER + eliminar espacios múltiples
  v_normalized_code := UPPER(TRIM(REGEXP_REPLACE(p_code, '\s+', ' ', 'g')));
  
  -- Buscar duplicados (case-insensitive)
  SELECT EXISTS (
    SELECT 1
    FROM pms_properties
    WHERE UPPER(TRIM(REGEXP_REPLACE(code, '\s+', ' ', 'g'))) = v_normalized_code
      AND tenant_id = p_tenant_id
      AND (p_property_id IS NULL OR id != p_property_id)
  ) INTO v_exists;
  
  RETURN NOT v_exists;
END;
$$;

-- validate_contract_number: Validación case-insensitive para números de contrato
CREATE OR REPLACE FUNCTION validate_contract_number(
  p_contract_number TEXT,
  p_contract_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_normalized_number TEXT;
  v_exists BOOLEAN;
BEGIN
  v_normalized_number := UPPER(TRIM(REGEXP_REPLACE(p_contract_number, '\s+', ' ', 'g')));
  
  SELECT EXISTS (
    SELECT 1
    FROM pms_contracts
    WHERE UPPER(TRIM(REGEXP_REPLACE(contract_number, '\s+', ' ', 'g'))) = v_normalized_number
      AND tenant_id = p_tenant_id
      AND (p_contract_id IS NULL OR id != p_contract_id)
  ) INTO v_exists;
  
  RETURN NOT v_exists;
END;
$$;