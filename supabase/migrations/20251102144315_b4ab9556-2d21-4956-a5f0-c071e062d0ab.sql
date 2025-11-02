-- Paso 1: Eliminar schedule items incorrectos con ajustes retroactivos
DELETE FROM pms_payment_schedule_items
WHERE contract_id = 'c7986757-cf43-442e-88d0-1f12ef085de2'
  AND item LIKE 'AJUSTE-%'
  AND period_date < '2025-11-01'::DATE;

-- Paso 2: Corregir la función generate_payment_schedule_items para prevenir ajustes retroactivos
CREATE OR REPLACE FUNCTION generate_payment_schedule_items(
  contract_id_param UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  projection_rec RECORD;
  existing_item RECORD;
  difference NUMERIC;
  tenant_id_val UUID;
  fecha_primer_ajuste_val DATE;
BEGIN
  -- Obtener tenant_id y fecha_primer_ajuste del contrato
  SELECT tenant_id, fecha_primer_ajuste 
  INTO tenant_id_val, fecha_primer_ajuste_val
  FROM pms_contracts
  WHERE id = contract_id_param;

  IF tenant_id_val IS NULL THEN
    RAISE EXCEPTION 'Contract not found: %', contract_id_param;
  END IF;

  -- Iterar sobre las proyecciones mensuales del contrato
  FOR projection_rec IN
    SELECT 
      period_date,
      item,
      adjusted_amount,
      adjustment_applied,
      adjustment_percentage
    FROM pms_contract_monthly_projections
    WHERE contract_id = contract_id_param
    ORDER BY period_date, item
  LOOP
    -- Verificar si ya existe un item de pago para esta fecha y concepto
    SELECT *
    INTO existing_item
    FROM pms_payment_schedule_items
    WHERE contract_id = contract_id_param
      AND period_date = projection_rec.period_date::DATE
      AND item = projection_rec.item;

    IF NOT FOUND THEN
      -- No existe: crear nuevo item
      INSERT INTO pms_payment_schedule_items (
        contract_id,
        tenant_id,
        period_date,
        item,
        expected_amount,
        accumulated_paid_amount,
        status
      )
      VALUES (
        contract_id_param,
        tenant_id_val,
        projection_rec.period_date,
        projection_rec.item,
        projection_rec.adjusted_amount,
        0,
        'pending'
      );
    ELSE
      -- Ya existe: actualizar expected_amount si no hay pagos registrados
      IF existing_item.accumulated_paid_amount = 0 THEN
        UPDATE pms_payment_schedule_items
        SET expected_amount = projection_rec.adjusted_amount,
            updated_at = NOW()
        WHERE id = existing_item.id;
      ELSE
        -- Si hay pagos registrados, calcular diferencia y crear item de ajuste diferencial
        difference := projection_rec.adjusted_amount - existing_item.expected_amount;
        
        -- VALIDACIÓN CLAVE: Solo crear ajuste si:
        -- 1. Hay una diferencia significativa
        -- 2. La fecha es posterior o igual a la fecha del primer ajuste
        -- 3. El ajuste realmente fue aplicado en la proyección
        IF ABS(difference) > 0.01 
           AND projection_rec.period_date >= COALESCE(fecha_primer_ajuste_val, projection_rec.period_date)
           AND projection_rec.adjustment_applied = true
        THEN
          -- Verificar si ya existe un item de ajuste para esta fecha
          IF NOT EXISTS (
            SELECT 1 
            FROM pms_payment_schedule_items
            WHERE contract_id = contract_id_param
              AND period_date = projection_rec.period_date::DATE
              AND item = 'AJUSTE-' || projection_rec.item
          ) THEN
            -- Crear item de ajuste diferencial
            INSERT INTO pms_payment_schedule_items (
              contract_id,
              tenant_id,
              period_date,
              item,
              expected_amount,
              accumulated_paid_amount,
              status
            )
            VALUES (
              contract_id_param,
              tenant_id_val,
              projection_rec.period_date,
              'AJUSTE-' || projection_rec.item,
              difference,
              0,
              'pending'
            );
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Paso 3: Inicializar pms_contract_current para el contrato PRIMA4302
INSERT INTO pms_contract_current (
  contract_id,
  tenant_id,
  current_amount,
  current_item_a,
  current_item_b,
  current_from,
  last_adjustment_date,
  next_adjustment_date
)
SELECT 
  id,
  tenant_id,
  monthly_rent,
  monto_a,
  monto_b,
  start_date,
  NULL,
  fecha_primer_ajuste
FROM pms_contracts
WHERE id = 'c7986757-cf43-442e-88d0-1f12ef085de2'
ON CONFLICT (contract_id) DO UPDATE
SET
  current_amount = EXCLUDED.current_amount,
  current_item_a = EXCLUDED.current_item_a,
  current_item_b = EXCLUDED.current_item_b,
  current_from = EXCLUDED.current_from,
  next_adjustment_date = EXCLUDED.next_adjustment_date,
  updated_at = NOW();

-- Paso 4: Registrar el ajuste de noviembre 2025 en el historial
INSERT INTO pms_contract_adjustments (
  contract_id,
  tenant_id,
  applied_at,
  period_from,
  period_to,
  prev_amount,
  new_amount,
  item_a_prev_amount,
  item_a_new_amount,
  item_b_prev_amount,
  item_b_new_amount,
  factor,
  pct_cumulative
)
SELECT
  'c7986757-cf43-442e-88d0-1f12ef085de2'::UUID,
  tenant_id,
  '2025-11-01'::DATE,
  '2025-08-01'::DATE,
  '2025-10-31'::DATE,
  700000,
  736842,
  500000,
  526316,
  200000,
  210526,
  1.052631578947368,
  5.26
FROM pms_contracts
WHERE id = 'c7986757-cf43-442e-88d0-1f12ef085de2'
ON CONFLICT DO NOTHING;

-- Paso 5: Actualizar pms_contract_current con el ajuste aplicado
UPDATE pms_contract_current
SET
  current_amount = 736842,
  current_item_a = 526316,
  current_item_b = 210526,
  last_adjustment_date = '2025-11-01',
  next_adjustment_date = '2026-02-01',
  updated_at = NOW()
WHERE contract_id = 'c7986757-cf43-442e-88d0-1f12ef085de2';

-- Paso 6: Regenerar schedule items para aplicar la nueva lógica corregida
SELECT generate_payment_schedule_items('c7986757-cf43-442e-88d0-1f12ef085de2'::UUID);