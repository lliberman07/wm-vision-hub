-- ═══════════════════════════════════════════════════════════════════════════════
-- SISTEMA DE AJUSTES SELECTIVOS POR ÍNDICES ECONÓMICOS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Objetivo: Recalcular SOLO los contratos afectados cuando se edita un índice
-- Performance: De 20-30 seg a 1-2 seg en producción
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 1: CORREGIR FOREIGN KEY CONSTRAINT
-- ═══════════════════════════════════════════════════════════════════════════════
-- Objetivo: Permitir regeneración de schedule items sin perder pagos asociados

-- 1.1. Modificar constraint para permitir SET NULL
ALTER TABLE pms_payments 
DROP CONSTRAINT IF EXISTS pms_payments_schedule_item_id_fkey;

ALTER TABLE pms_payments 
ADD CONSTRAINT pms_payments_schedule_item_id_fkey 
FOREIGN KEY (schedule_item_id) 
REFERENCES pms_payment_schedule_items(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- 1.2. Recrear índice optimizado
DROP INDEX IF EXISTS idx_payments_schedule_item;
CREATE INDEX idx_payments_schedule_item 
ON pms_payments(schedule_item_id) 
WHERE schedule_item_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 2: MODIFICAR generate_contract_monthly_projections
-- ═══════════════════════════════════════════════════════════════════════════════
-- Cambios: Parámetro from_date, eliminación selectiva, recuperación de montos base

DROP FUNCTION IF EXISTS generate_contract_monthly_projections(uuid);

CREATE OR REPLACE FUNCTION generate_contract_monthly_projections(
  contract_id_param UUID,
  from_date DATE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contract_rec RECORD;
  current_month DATE;
  start_month DATE;
  month_count INTEGER := 1;
  monto_a_actual NUMERIC;
  monto_b_actual NUMERIC;
  months_since_first_adjustment INTEGER;
  apply_adjustment BOOLEAN;
  adjustment_months INTEGER;
  total_adjustment_percentage NUMERIC;
  indices_array JSONB;
  idx_record RECORD;
BEGIN
  SELECT * INTO contract_rec
  FROM pms_contracts
  WHERE id = contract_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado';
  END IF;

  -- Determinar mes de inicio
  IF from_date IS NOT NULL THEN
    start_month := DATE_TRUNC('month', from_date)::DATE;
    RAISE NOTICE 'Regenerando proyecciones desde: %', start_month;
  ELSE
    start_month := DATE_TRUNC('month', contract_rec.start_date)::DATE;
    RAISE NOTICE 'Generando proyecciones completas desde inicio del contrato';
  END IF;

  -- Eliminar SOLO proyecciones futuras que NO tienen pagos asociados
  DELETE FROM pms_contract_monthly_projections 
  WHERE contract_id = contract_id_param
    AND period_date >= start_month
    AND id NOT IN (
      SELECT DISTINCT proj.id
      FROM pms_contract_monthly_projections proj
      INNER JOIN pms_payment_schedule_items psi ON psi.contract_id = proj.contract_id 
        AND psi.period_date::DATE = proj.period_date 
        AND psi.item = proj.item
      INNER JOIN pms_payments p ON p.schedule_item_id = psi.id
      WHERE proj.contract_id = contract_id_param
        AND p.status = 'paid'
    );

  RAISE NOTICE 'Proyecciones futuras sin pagos eliminadas';

  -- Determinar cantidad de meses según frecuencia
  adjustment_months := CASE contract_rec.frecuencia_ajuste
    WHEN 'Trimestral' THEN 3
    WHEN 'Semestral' THEN 6
    WHEN 'Anual' THEN 12
    ELSE 0
  END;

  -- Recuperar montos base del último mes válido ANTES de from_date
  IF from_date IS NOT NULL THEN
    SELECT adjusted_amount INTO monto_a_actual
    FROM pms_contract_monthly_projections
    WHERE contract_id = contract_id_param
      AND period_date < start_month
      AND item = 'A'
    ORDER BY period_date DESC
    LIMIT 1;

    SELECT adjusted_amount INTO monto_b_actual
    FROM pms_contract_monthly_projections
    WHERE contract_id = contract_id_param
      AND period_date < start_month
      AND item = 'B'
    ORDER BY period_date DESC
    LIMIT 1;

    IF monto_a_actual IS NULL THEN
      monto_a_actual := COALESCE(contract_rec.monto_a, contract_rec.monthly_rent);
      RAISE NOTICE 'No hay histórico previo para Item A, usando monto base: %', monto_a_actual;
    ELSE
      RAISE NOTICE 'Recuperado monto previo Item A: %', monto_a_actual;
    END IF;

    IF monto_b_actual IS NULL AND COALESCE(contract_rec.monto_b, 0) > 0 THEN
      monto_b_actual := contract_rec.monto_b;
      RAISE NOTICE 'No hay histórico previo para Item B, usando monto base: %', monto_b_actual;
    ELSE
      RAISE NOTICE 'Recuperado monto previo Item B: %', COALESCE(monto_b_actual, 0);
    END IF;

    month_count := EXTRACT(YEAR FROM AGE(start_month, contract_rec.start_date)) * 12 
                 + EXTRACT(MONTH FROM AGE(start_month, contract_rec.start_date)) + 1;
  ELSE
    monto_a_actual := COALESCE(contract_rec.monto_a, contract_rec.monthly_rent);
    monto_b_actual := COALESCE(contract_rec.monto_b, 0);
    month_count := 1;
  END IF;

  current_month := start_month;
  
  WHILE current_month <= contract_rec.end_date LOOP
    apply_adjustment := false;
    total_adjustment_percentage := 0;
    indices_array := '[]'::jsonb;

    IF contract_rec.fecha_primer_ajuste IS NOT NULL 
       AND contract_rec.indice_ajuste IS NOT NULL 
       AND adjustment_months > 0 THEN
      
      months_since_first_adjustment := EXTRACT(YEAR FROM AGE(current_month, contract_rec.fecha_primer_ajuste)) * 12 
                                     + EXTRACT(MONTH FROM AGE(current_month, contract_rec.fecha_primer_ajuste));
      
      IF months_since_first_adjustment >= 0 AND months_since_first_adjustment % adjustment_months = 0 THEN
        apply_adjustment := true;
        
        FOR idx_record IN 
          SELECT period, value 
          FROM pms_economic_indices
          WHERE index_type = contract_rec.indice_ajuste
            AND TO_DATE(period || '-01', 'YYYY-MM-DD') < current_month
            AND TO_DATE(period || '-01', 'YYYY-MM-DD') >= current_month - (adjustment_months || ' months')::INTERVAL
          ORDER BY period ASC
        LOOP
          indices_array := indices_array || jsonb_build_object(
            'period', idx_record.period,
            'value', idx_record.value,
            'type', contract_rec.indice_ajuste
          );
        END LOOP;

        IF jsonb_array_length(indices_array) = adjustment_months THEN
          total_adjustment_percentage := (pms_ipc_factor(
            current_month - (adjustment_months || ' months')::INTERVAL,
            current_month - INTERVAL '1 day'
          ) - 1) * 100;
          
          monto_a_actual := monto_a_actual * (1 + total_adjustment_percentage / 100);
          IF monto_b_actual > 0 THEN
            monto_b_actual := monto_b_actual * (1 + total_adjustment_percentage / 100);
          END IF;

          IF contract_rec.rounding_mode = 'UP' THEN
            monto_a_actual := CEIL(monto_a_actual);
            monto_b_actual := CASE WHEN monto_b_actual > 0 THEN CEIL(monto_b_actual) ELSE 0 END;
          ELSIF contract_rec.rounding_mode = 'DOWN' THEN
            monto_a_actual := FLOOR(monto_a_actual);
            monto_b_actual := CASE WHEN monto_b_actual > 0 THEN FLOOR(monto_b_actual) ELSE 0 END;
          ELSE
            monto_a_actual := ROUND(monto_a_actual);
            monto_b_actual := CASE WHEN monto_b_actual > 0 THEN ROUND(monto_b_actual) ELSE 0 END;
          END IF;

          RAISE NOTICE '  ✓ Ajuste aplicado en %: A=%, B=%, Factor=%', 
            current_month, monto_a_actual, monto_b_actual, total_adjustment_percentage;
        ELSE
          apply_adjustment := false;
          RAISE NOTICE '  ⏳ Ajuste pendiente en % (faltan % índices)', 
            current_month, (adjustment_months - jsonb_array_length(indices_array));
        END IF;
      END IF;
    END IF;

    INSERT INTO pms_contract_monthly_projections (
      contract_id, tenant_id, month_number, period_date, item,
      base_amount, adjustment_applied, adjustment_percentage,
      adjusted_amount, indices_used, pending_indices
    ) VALUES (
      contract_id_param, contract_rec.tenant_id, month_count, current_month, 'A',
      COALESCE(contract_rec.monto_a, contract_rec.monthly_rent),
      apply_adjustment, total_adjustment_percentage,
      monto_a_actual,
      CASE WHEN apply_adjustment THEN 
        jsonb_build_object(
          'applied', true,
          'adjustment_month', TO_CHAR(current_month, 'YYYY-MM'),
          'base_amount', monto_a_actual / (1 + total_adjustment_percentage / 100),
          'indices', indices_array,
          'total_percentage', total_adjustment_percentage,
          'adjusted_amount', monto_a_actual
        )
      ELSE NULL END,
      (apply_adjustment AND jsonb_array_length(indices_array) < adjustment_months)
    );

    IF COALESCE(contract_rec.monto_b, 0) > 0 THEN
      INSERT INTO pms_contract_monthly_projections (
        contract_id, tenant_id, month_number, period_date, item,
        base_amount, adjustment_applied, adjustment_percentage,
        adjusted_amount, indices_used, pending_indices
      ) VALUES (
        contract_id_param, contract_rec.tenant_id, month_count, current_month, 'B',
        contract_rec.monto_b,
        apply_adjustment, total_adjustment_percentage,
        monto_b_actual,
        CASE WHEN apply_adjustment THEN 
          jsonb_build_object(
            'applied', true,
            'adjustment_month', TO_CHAR(current_month, 'YYYY-MM'),
            'base_amount', monto_b_actual / (1 + total_adjustment_percentage / 100),
            'indices', indices_array,
            'total_percentage', total_adjustment_percentage,
            'adjusted_amount', monto_b_actual
          )
        ELSE NULL END,
        (apply_adjustment AND jsonb_array_length(indices_array) < adjustment_months)
      );
    END IF;

    current_month := current_month + INTERVAL '1 month';
    month_count := month_count + 1;
  END LOOP;

  RAISE NOTICE 'Proyecciones generadas exitosamente para %', contract_id_param;
END;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 3: CREAR FUNCIÓN DE RECÁLCULO SELECTIVO
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION recalculate_contracts_affected_by_period(
  index_type_param TEXT,
  index_period TEXT
)
RETURNS TABLE(
  contract_id UUID,
  contract_number TEXT,
  adjustment_date DATE,
  window_start DATE,
  window_end DATE,
  status TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  period_date DATE;
  contract_rec RECORD;
  next_adj_date DATE;
  window_start_date DATE;
  months_in_freq INT;
  total_recalculated INT := 0;
BEGIN
  period_date := TO_DATE(index_period || '-01', 'YYYY-MM-DD');
  
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Buscando contratos afectados por índice % %', 
    index_type_param, index_period;
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  FOR contract_rec IN
    SELECT 
      c.id,
      c.contract_number,
      c.fecha_primer_ajuste,
      c.frecuencia_ajuste,
      c.indice_ajuste,
      c.start_date,
      c.end_date
    FROM pms_contracts c
    WHERE c.status = 'active'
      AND c.indice_ajuste = index_type_param
      AND c.fecha_primer_ajuste IS NOT NULL
      AND c.frecuencia_ajuste IS NOT NULL
    ORDER BY c.contract_number
  LOOP
    months_in_freq := pms_months_in_frequency(contract_rec.frecuencia_ajuste);
    
    next_adj_date := pms_next_adjustment_date(
      contract_rec.fecha_primer_ajuste,
      contract_rec.frecuencia_ajuste,
      period_date
    );
    
    window_start_date := next_adj_date - (months_in_freq || ' months')::INTERVAL;
    
    IF period_date >= window_start_date AND period_date < next_adj_date THEN
      RAISE NOTICE '  ✓ %: Ajuste % usa ventana [%, %)', 
        contract_rec.contract_number, 
        TO_CHAR(next_adj_date, 'YYYY-MM-DD'),
        TO_CHAR(window_start_date, 'YYYY-MM'),
        TO_CHAR(next_adj_date, 'YYYY-MM');
      
      PERFORM generate_contract_monthly_projections(
        contract_rec.id,
        next_adj_date
      );
      
      PERFORM generate_payment_schedule_items(contract_rec.id);
      
      total_recalculated := total_recalculated + 1;
      
      contract_id := contract_rec.id;
      contract_number := contract_rec.contract_number;
      adjustment_date := next_adj_date;
      window_start := window_start_date;
      window_end := next_adj_date - INTERVAL '1 day';
      status := 'recalculated';
      message := FORMAT('Proyecciones regeneradas desde %s (ventana: %s a %s)',
        TO_CHAR(next_adj_date, 'YYYY-MM-DD'),
        TO_CHAR(window_start_date, 'YYYY-MM'),
        TO_CHAR(next_adj_date - INTERVAL '1 day', 'YYYY-MM'));
      RETURN NEXT;
    ELSE
      RAISE NOTICE '  ✗ %: No afectado (ventana [%, %) no incluye %)', 
        contract_rec.contract_number,
        TO_CHAR(window_start_date, 'YYYY-MM'),
        TO_CHAR(next_adj_date, 'YYYY-MM'),
        index_period;
    END IF;
  END LOOP;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Total de contratos recalculados: %', total_recalculated;
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  
  IF total_recalculated = 0 THEN
    contract_id := NULL;
    contract_number := NULL;
    adjustment_date := NULL;
    window_start := NULL;
    window_end := NULL;
    status := 'no_contracts_affected';
    message := 'No se encontraron contratos afectados por este índice en este período';
    RETURN NEXT;
  END IF;
END;
$function$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 4: ACTUALIZAR TRIGGER PARA DETECTAR EDICIONES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS recalculate_projections_on_index_change ON pms_economic_indices;
DROP FUNCTION IF EXISTS trigger_recalculate_on_index_change();
DROP FUNCTION IF EXISTS recalculate_projections_for_index_type(text);

CREATE OR REPLACE FUNCTION trigger_recalculate_on_index_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_rec RECORD;
  total_recalculated INT := 0;
  value_change NUMERIC;
  is_significant BOOLEAN := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    RAISE NOTICE '📊 Nuevo índice registrado: % % = %', 
      NEW.index_type, NEW.period, NEW.value;
    is_significant := true;
    
  ELSIF TG_OP = 'UPDATE' THEN
    value_change := ABS(NEW.value - OLD.value);
    
    IF value_change >= 0.01 THEN
      is_significant := true;
      RAISE NOTICE '📝 Índice editado: % % de % a % (Δ=%)',
        NEW.index_type, NEW.period, OLD.value, NEW.value, value_change;
    ELSE
      RAISE NOTICE '⏭️  Cambio insignificante en % % (Δ=%), ignorando recálculo',
        NEW.index_type, NEW.period, value_change;
      RETURN NEW;
    END IF;
  END IF;

  IF is_significant THEN
    FOR result_rec IN 
      SELECT * FROM recalculate_contracts_affected_by_period(
        NEW.index_type,
        NEW.period
      )
    LOOP
      IF result_rec.status = 'recalculated' THEN
        total_recalculated := total_recalculated + 1;
        RAISE NOTICE '    ✓ %: %', result_rec.contract_number, result_rec.message;
      END IF;
    END LOOP;
    
    IF total_recalculated > 0 THEN
      RAISE NOTICE '✅ Recálculo completado: % contrato(s) actualizado(s)', total_recalculated;
    ELSE
      RAISE NOTICE 'ℹ️  No se encontraron contratos afectados por este índice';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER recalculate_projections_on_index_change
AFTER INSERT OR UPDATE ON pms_economic_indices
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_on_index_change();

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 5: MEJORAR generate_payment_schedule_items
-- ═══════════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS generate_payment_schedule_items(uuid);

CREATE OR REPLACE FUNCTION generate_payment_schedule_items(
  contract_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contract_rec RECORD;
  projection_rec RECORD;
  existing_item RECORD;
  actual_paid_amount NUMERIC;
  calculated_amount NUMERIC;
  difference NUMERIC;
BEGIN
  SELECT * INTO contract_rec
  FROM pms_contracts
  WHERE id = contract_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado';
  END IF;

  RAISE NOTICE 'Generando schedule items para contrato %', contract_rec.contract_number;

  FOR projection_rec IN
    SELECT 
      period_date,
      item,
      adjusted_amount,
      pending_indices
    FROM pms_contract_monthly_projections
    WHERE contract_id = contract_id_param
    ORDER BY period_date, item
  LOOP
    SELECT * INTO existing_item
    FROM pms_payment_schedule_items
    WHERE contract_id = contract_id_param
      AND period_date = projection_rec.period_date::TEXT
      AND item = projection_rec.item;

    IF FOUND THEN
      SELECT COALESCE(SUM(paid_amount), 0) INTO actual_paid_amount
      FROM pms_payments
      WHERE schedule_item_id = existing_item.id
        AND status = 'paid';
      
      calculated_amount := projection_rec.adjusted_amount;
      difference := calculated_amount - actual_paid_amount;
      
      RAISE NOTICE '  → % Item %: Esperado=%, Pagado=%, Saldo=%', 
        projection_rec.period_date, projection_rec.item,
        calculated_amount, actual_paid_amount, difference;
      
      UPDATE pms_payment_schedule_items
      SET 
        expected_amount = calculated_amount,
        status = CASE 
          WHEN actual_paid_amount >= calculated_amount THEN 'paid'
          WHEN actual_paid_amount > 0 AND actual_paid_amount < calculated_amount THEN 'partially_paid'
          WHEN actual_paid_amount = 0 AND projection_rec.period_date::DATE < CURRENT_DATE THEN 'overdue'
          WHEN actual_paid_amount = 0 THEN 'pending'
          ELSE status
        END,
        notes = CASE 
          WHEN actual_paid_amount > 0 AND actual_paid_amount < calculated_amount 
          THEN FORMAT('Pagado: $%s - Saldo pendiente: $%s', 
               TO_CHAR(actual_paid_amount, 'FM999,999,999.00'),
               TO_CHAR(difference, 'FM999,999,999.00'))
          WHEN actual_paid_amount >= calculated_amount
          THEN FORMAT('Pago completo: $%s', TO_CHAR(actual_paid_amount, 'FM999,999,999.00'))
          WHEN projection_rec.pending_indices
          THEN 'Monto sujeto a ajuste (pendiente de índices)'
          ELSE NULL
        END,
        pending_indices = projection_rec.pending_indices,
        updated_at = NOW()
      WHERE id = existing_item.id;
      
    ELSE
      INSERT INTO pms_payment_schedule_items (
        contract_id, tenant_id, period_date, item,
        expected_amount, status, pending_indices
      )
      SELECT 
        contract_id_param,
        contract_rec.tenant_id,
        projection_rec.period_date::TEXT,
        projection_rec.item,
        projection_rec.adjusted_amount,
        CASE 
          WHEN projection_rec.period_date::DATE < CURRENT_DATE THEN 'overdue'
          ELSE 'pending'
        END,
        projection_rec.pending_indices;
      
      RAISE NOTICE '  ✓ Nuevo item creado: % Item % = $%',
        projection_rec.period_date, projection_rec.item, projection_rec.adjusted_amount;
    END IF;
  END LOOP;

  RAISE NOTICE 'Schedule items actualizados para %', contract_rec.contract_number;
END;
$function$;