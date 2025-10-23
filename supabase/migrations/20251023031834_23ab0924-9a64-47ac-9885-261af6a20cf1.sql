-- Corrección de seguridad: Agregar search_path a las funciones creadas

DROP FUNCTION IF EXISTS generate_renewal_code(UUID);
DROP FUNCTION IF EXISTS can_renew_contract(UUID);
DROP FUNCTION IF EXISTS validate_renewal_dates(UUID, DATE);

-- Función: Generar código de renovación (CON search_path)
CREATE OR REPLACE FUNCTION generate_renewal_code(parent_contract_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parent_base_code TEXT;
  parent_renewal_count INTEGER;
  new_renewal_count INTEGER;
BEGIN
  SELECT 
    COALESCE(base_contract_number, contract_number),
    COALESCE(renewal_count, 0)
  INTO parent_base_code, parent_renewal_count
  FROM pms_contracts
  WHERE id = parent_contract_id_param;
  
  IF parent_base_code IS NULL THEN
    RAISE EXCEPTION 'Contrato padre no encontrado';
  END IF;
  
  IF parent_base_code ~ '-R\d+$' THEN
    parent_base_code := regexp_replace(parent_base_code, '-R\d+$', '');
  END IF;
  
  new_renewal_count := parent_renewal_count + 1;
  
  RETURN parent_base_code || '-R' || new_renewal_count;
END;
$$;

-- Función: Verificar elegibilidad de renovación (CON search_path)
CREATE OR REPLACE FUNCTION can_renew_contract(contract_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  overdue_count INTEGER;
  days_since_end INTEGER;
  contract_end_date DATE;
  result JSONB;
BEGIN
  SELECT end_date INTO contract_end_date
  FROM pms_contracts
  WHERE id = contract_id_param;
  
  IF contract_end_date IS NULL THEN
    RAISE EXCEPTION 'Contrato no encontrado';
  END IF;
  
  days_since_end := CURRENT_DATE - contract_end_date;
  
  SELECT COUNT(*) INTO overdue_count
  FROM pms_payment_schedule_items
  WHERE contract_id = contract_id_param
    AND period_date < CURRENT_DATE::TEXT
    AND status IN ('pending', 'partial', 'overdue');
  
  result := jsonb_build_object(
    'can_renew', (overdue_count = 0),
    'overdue_count', overdue_count,
    'days_since_end', days_since_end,
    'has_overdue_warning', (overdue_count > 0),
    'end_date', contract_end_date
  );
  
  RETURN result;
END;
$$;

-- Función: Validar fechas de renovación (CON search_path)
CREATE OR REPLACE FUNCTION validate_renewal_dates(
  parent_contract_id_param UUID,
  proposed_start_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parent_end_date DATE;
  expected_start_date DATE;
BEGIN
  SELECT end_date INTO parent_end_date
  FROM pms_contracts
  WHERE id = parent_contract_id_param;
  
  IF parent_end_date IS NULL THEN
    RAISE EXCEPTION 'Contrato padre no encontrado';
  END IF;
  
  expected_start_date := parent_end_date + INTERVAL '1 day';
  
  RETURN (proposed_start_date = expected_start_date);
END;
$$;