-- Limpieza definitiva de registros de cashflow obsoletos y recálculo automático
-- Elimina datos calculados antes de la corrección del trigger (2025-11-10 03:11:03)

-- Paso 1: Eliminar registros de cashflow creados antes del fix del trigger
DELETE FROM pms_cashflow_property
WHERE created_at < '2025-11-10 03:11:03+00';

-- Paso 2: Forzar recálculo de todos los contratos activos
DO $$
DECLARE
  contract_record RECORD;
  payment_id UUID;
BEGIN
  -- Iterar sobre cada contrato activo
  FOR contract_record IN 
    SELECT DISTINCT id, contract_number 
    FROM pms_contracts 
    WHERE status = 'active'
  LOOP
    -- Buscar un pago pagado de este contrato
    SELECT p.id INTO payment_id
    FROM pms_payments p
    WHERE p.contract_id = contract_record.id
      AND p.status = 'paid'
    LIMIT 1;
    
    -- Si existe un pago, actualizarlo para disparar el trigger
    IF payment_id IS NOT NULL THEN
      UPDATE pms_payments
      SET updated_at = NOW()
      WHERE id = payment_id;
      
      RAISE NOTICE 'Recalculado cashflow para contrato %', contract_record.contract_number;
    END IF;
  END LOOP;
END $$;