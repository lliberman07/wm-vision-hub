-- Ajustar generate_contract_monthly_projections para que haga upsert
-- y no falle por la unique (contract_id, period_date, item)

CREATE OR REPLACE FUNCTION public.generate_contract_monthly_projections(contract_id_param uuid, from_date date DEFAULT NULL::date)
RETURNS void
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

    -- Upsert para Item A
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
    )
    ON CONFLICT (contract_id, period_date, item)
    DO UPDATE SET
      month_number = EXCLUDED.month_number,
      base_amount = EXCLUDED.base_amount,
      adjustment_applied = EXCLUDED.adjustment_applied,
      adjustment_percentage = EXCLUDED.adjustment_percentage,
      adjusted_amount = EXCLUDED.adjusted_amount,
      indices_used = EXCLUDED.indices_used,
      pending_indices = EXCLUDED.pending_indices,
      updated_at = now();

    -- Upsert para Item B (si aplica)
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
      )
      ON CONFLICT (contract_id, period_date, item)
      DO UPDATE SET
        month_number = EXCLUDED.month_number,
        base_amount = EXCLUDED.base_amount,
        adjustment_applied = EXCLUDED.adjustment_applied,
        adjustment_percentage = EXCLUDED.adjustment_percentage,
        adjusted_amount = EXCLUDED.adjusted_amount,
        indices_used = EXCLUDED.indices_used,
        pending_indices = EXCLUDED.pending_indices,
        updated_at = now();
    END IF;

    current_month := current_month + INTERVAL '1 month';
    month_count := month_count + 1;
  END LOOP;

  RAISE NOTICE 'Proyecciones generadas exitosamente para %', contract_id_param;
END;
$function$;