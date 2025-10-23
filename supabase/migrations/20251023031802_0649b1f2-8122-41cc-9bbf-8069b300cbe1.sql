-- ============================================
-- Migración: Sistema de Renovación de Contratos
-- ============================================

-- 1. Agregar campos para tracking de renovaciones
ALTER TABLE pms_contracts 
ADD COLUMN IF NOT EXISTS base_contract_number TEXT,
ADD COLUMN IF NOT EXISTS renewal_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_contract_id UUID REFERENCES pms_contracts(id),
ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN DEFAULT false;

-- 2. Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_pms_contracts_base_number ON pms_contracts(base_contract_number);
CREATE INDEX IF NOT EXISTS idx_pms_contracts_parent_id ON pms_contracts(parent_contract_id);
CREATE INDEX IF NOT EXISTS idx_pms_contracts_is_renewal ON pms_contracts(is_renewal);

-- 3. Comentarios para documentación
COMMENT ON COLUMN pms_contracts.base_contract_number IS 'Código base sin sufijos de renovación (ej: Lambare1140-01)';
COMMENT ON COLUMN pms_contracts.renewal_count IS 'Número de renovación (0 = original, 1 = R1, 2 = R2, etc)';
COMMENT ON COLUMN pms_contracts.parent_contract_id IS 'ID del contrato que fue renovado';
COMMENT ON COLUMN pms_contracts.is_renewal IS 'Indica si este contrato es una renovación';

-- 4. Función: Generar código de renovación
CREATE OR REPLACE FUNCTION generate_renewal_code(parent_contract_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  parent_base_code TEXT;
  parent_renewal_count INTEGER;
  new_renewal_count INTEGER;
BEGIN
  -- Obtener datos del contrato padre
  SELECT 
    COALESCE(base_contract_number, contract_number),
    COALESCE(renewal_count, 0)
  INTO parent_base_code, parent_renewal_count
  FROM pms_contracts
  WHERE id = parent_contract_id_param;
  
  IF parent_base_code IS NULL THEN
    RAISE EXCEPTION 'Contrato padre no encontrado';
  END IF;
  
  -- Si el padre ya tiene sufijo -R, extraer el código base
  IF parent_base_code ~ '-R\d+$' THEN
    parent_base_code := regexp_replace(parent_base_code, '-R\d+$', '');
  END IF;
  
  -- Incrementar contador de renovaciones
  new_renewal_count := parent_renewal_count + 1;
  
  -- Retornar código con sufijo de renovación
  RETURN parent_base_code || '-R' || new_renewal_count;
END;
$$;

-- 5. Función: Verificar si un contrato puede ser renovado
CREATE OR REPLACE FUNCTION can_renew_contract(contract_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  overdue_count INTEGER;
  days_since_end INTEGER;
  contract_end_date DATE;
  result JSONB;
BEGIN
  -- Obtener fecha de fin del contrato
  SELECT end_date INTO contract_end_date
  FROM pms_contracts
  WHERE id = contract_id_param;
  
  IF contract_end_date IS NULL THEN
    RAISE EXCEPTION 'Contrato no encontrado';
  END IF;
  
  -- Calcular días desde el fin del contrato
  days_since_end := CURRENT_DATE - contract_end_date;
  
  -- Contar pagos vencidos no pagados
  SELECT COUNT(*) INTO overdue_count
  FROM pms_payment_schedule_items
  WHERE contract_id = contract_id_param
    AND period_date < CURRENT_DATE::TEXT
    AND status IN ('pending', 'partial', 'overdue');
  
  -- Construir respuesta
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

-- 6. Función: Validar fechas de renovación
CREATE OR REPLACE FUNCTION validate_renewal_dates(
  parent_contract_id_param UUID,
  proposed_start_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Calcular fecha esperada (día siguiente)
  expected_start_date := parent_end_date + INTERVAL '1 day';
  
  -- Validar que coincidan
  RETURN (proposed_start_date = expected_start_date);
END;
$$;

COMMENT ON FUNCTION generate_renewal_code IS 'Genera código de renovación: BaseCode-RN';
COMMENT ON FUNCTION can_renew_contract IS 'Verifica si un contrato puede ser renovado y retorna información de validación';
COMMENT ON FUNCTION validate_renewal_dates IS 'Valida que la fecha de inicio de renovación sea exactamente el día siguiente al fin del contrato padre';