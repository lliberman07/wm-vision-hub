-- ============================================
-- MIGRACIÓN SEGURA: Fix indice_ajuste constraint
-- Permite NULL para contratos sin índice de ajuste
-- ============================================

-- ✅ PASO 1: Verificación ANTES - Mostrar contratos con ajustes activos
DO $$
DECLARE
  active_with_adjustments INTEGER;
  total_active INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_with_adjustments
  FROM pms_contracts
  WHERE status = 'active'
    AND indice_ajuste IS NOT NULL
    AND indice_ajuste != '';

  SELECT COUNT(*) INTO total_active
  FROM pms_contracts
  WHERE status = 'active';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN ANTES DE LA MIGRACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Contratos activos totales: %', total_active;
  RAISE NOTICE 'Contratos activos CON ajuste: %', active_with_adjustments;
  RAISE NOTICE '========================================';
END $$;

-- ✅ PASO 2: Mostrar detalle de contratos con ajustes
DO $$
DECLARE
  contract_record RECORD;
  counter INTEGER := 0;
BEGIN
  RAISE NOTICE 'Detalle de contratos con cláusulas de ajuste:';
  RAISE NOTICE '----------------------------------------';
  
  FOR contract_record IN
    SELECT 
      contract_number,
      indice_ajuste,
      frecuencia_ajuste,
      fecha_primer_ajuste,
      status
    FROM pms_contracts
    WHERE status = 'active'
      AND indice_ajuste IS NOT NULL
      AND indice_ajuste != ''
    ORDER BY contract_number
  LOOP
    counter := counter + 1;
    RAISE NOTICE '% - Contrato: %, Índice: %, Frecuencia: %, Fecha Ajuste: %, Estado: %',
      counter,
      contract_record.contract_number,
      contract_record.indice_ajuste,
      contract_record.frecuencia_ajuste,
      contract_record.fecha_primer_ajuste,
      contract_record.status;
  END LOOP;
  
  IF counter = 0 THEN
    RAISE NOTICE 'No hay contratos activos con ajustes configurados';
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- ✅ PASO 3: Modificar el constraint para permitir NULL
ALTER TABLE pms_contracts
  DROP CONSTRAINT IF EXISTS check_indice_ajuste;

ALTER TABLE pms_contracts
  ADD CONSTRAINT check_indice_ajuste
    CHECK (
      indice_ajuste IS NULL 
      OR indice_ajuste IN ('Sin ajuste', 'IPC', 'ICL', 'UVA')
    );

COMMENT ON CONSTRAINT check_indice_ajuste ON pms_contracts IS 
  'Permite NULL cuando no se aplica índice de ajuste, o valores específicos (Sin ajuste, IPC, ICL, UVA) cuando sí aplica';

-- ✅ PASO 4: Verificación DESPUÉS - Confirmar que los datos no cambiaron
DO $$
DECLARE
  active_with_adjustments_after INTEGER;
  total_active_after INTEGER;
  contracts_affected INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_with_adjustments_after
  FROM pms_contracts
  WHERE status = 'active'
    AND indice_ajuste IS NOT NULL
    AND indice_ajuste != '';

  SELECT COUNT(*) INTO total_active_after
  FROM pms_contracts
  WHERE status = 'active';

  -- Verificar si algún contrato fue modificado (no debería pasar)
  SELECT COUNT(*) INTO contracts_affected
  FROM pms_contracts
  WHERE updated_at > NOW() - INTERVAL '1 minute'
    AND status = 'active';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN DESPUÉS DE LA MIGRACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Contratos activos totales: %', total_active_after;
  RAISE NOTICE 'Contratos activos CON ajuste: %', active_with_adjustments_after;
  RAISE NOTICE 'Contratos modificados en esta migración: %', contracts_affected;
  RAISE NOTICE '========================================';
  
  IF contracts_affected > 0 THEN
    RAISE WARNING '⚠️ ATENCIÓN: Se detectaron % contratos modificados durante la migración', contracts_affected;
  ELSE
    RAISE NOTICE '✅ ÉXITO: Ningún contrato existente fue modificado';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ✅ PASO 5: Validar integridad de datos
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM pms_contracts
  WHERE indice_ajuste IS NOT NULL
    AND indice_ajuste NOT IN ('Sin ajuste', 'IPC', 'ICL', 'UVA');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION '❌ ERROR: Se encontraron % contratos con valores inválidos de indice_ajuste', invalid_count;
  ELSE
    RAISE NOTICE '✅ Validación de integridad: Todos los valores de indice_ajuste son válidos';
  END IF;
END $$;