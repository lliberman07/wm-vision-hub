-- =====================================================================
-- MIGRACIÓN 1: Agregar campos faltantes y vistas de compatibilidad
-- =====================================================================

-- 1. Agregar campos faltantes a pms_contracts
ALTER TABLE pms_contracts 
  ADD COLUMN IF NOT EXISTS rounding_mode text NOT NULL DEFAULT 'NEAREST';

-- 2. Agregar constraints de validación
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_rounding_mode'
  ) THEN
    ALTER TABLE pms_contracts
      ADD CONSTRAINT check_rounding_mode 
        CHECK (rounding_mode IN ('NEAREST', 'UP', 'DOWN'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_indice_ajuste'
  ) THEN
    ALTER TABLE pms_contracts
      ADD CONSTRAINT check_indice_ajuste
        CHECK (indice_ajuste IN ('Sin ajuste', 'IPC', 'ICL', 'UVA'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_frecuencia_ajuste'
  ) THEN
    ALTER TABLE pms_contracts
      ADD CONSTRAINT check_frecuencia_ajuste
        CHECK (frecuencia_ajuste IN ('Mensual', 'Trimestral', 'Semestral', 'Anual'));
  END IF;
END $$;

-- 3. Vista de compatibilidad para IPC mensual con cálculo de porcentaje
CREATE OR REPLACE VIEW pms_index_ipc_monthly AS
WITH ipc_with_lag AS (
  SELECT 
    id,
    index_type as type,
    (period || '-01')::date as period_date,
    value,
    LAG(value) OVER (ORDER BY period) as prev_value,
    source,
    created_at as loaded_at
  FROM pms_economic_indices
  WHERE index_type = 'IPC'
)
SELECT 
  id, 
  type, 
  period_date,
  CASE 
    WHEN prev_value IS NOT NULL AND prev_value > 0 
    THEN ((value / prev_value - 1) * 100)::numeric
    ELSE 0
  END as pct,
  source,
  loaded_at
FROM ipc_with_lag;

-- 4. Vista general para todos los índices
CREATE OR REPLACE VIEW pms_indices AS
SELECT * FROM pms_index_ipc_monthly
UNION ALL
SELECT 
  id,
  index_type as type,
  (period || '-01')::date as period_date,
  0 as pct,
  source,
  created_at as loaded_at
FROM pms_economic_indices
WHERE index_type IN ('ICL', 'UVA');

-- 5. Funciones auxiliares de frecuencia
CREATE OR REPLACE FUNCTION pms_months_in_frequency(freq text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE upper($1)
    WHEN 'MENSUAL' THEN 1
    WHEN 'TRIMESTRAL' THEN 3
    WHEN 'SEMESTRAL' THEN 6
    WHEN 'ANUAL' THEN 12
    ELSE 3
  END;
$$;

-- 6. Calcular próxima fecha de ajuste
CREATE OR REPLACE FUNCTION pms_next_adjustment_date(
  start_date date, 
  freq text, 
  ref_date date
)
RETURNS date LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  step int := pms_months_in_frequency(freq);
  d date := date_trunc('month', start_date)::date;
BEGIN
  IF ref_date < d THEN
    RETURN d + (step || ' months')::interval;
  END IF;
  LOOP
    d := d + (step || ' months')::interval;
    IF d > ref_date THEN
      RETURN d;
    END IF;
  END LOOP;
END;
$$;

-- 7. Calcular última fecha de ajuste cumplida
CREATE OR REPLACE FUNCTION pms_last_adjustment_date(
  start_date date, 
  freq text, 
  ref_date date
)
RETURNS date LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  step int := pms_months_in_frequency(freq);
  d date := date_trunc('month', start_date)::date;
  prev date := d;
BEGIN
  IF ref_date < d THEN
    RETURN NULL;
  END IF;
  LOOP
    d := d + (step || ' months')::interval;
    EXIT WHEN d > ref_date;
    prev := d;
  END LOOP;
  RETURN prev;
END;
$$;

-- 8. Factor multiplicativo IPC
CREATE OR REPLACE FUNCTION pms_ipc_factor(month_from date, month_to date)
RETURNS numeric LANGUAGE sql AS $$
  WITH monthly_factors AS (
    SELECT exp(sum(ln(1 + pct/100.0))) as factor
    FROM pms_index_ipc_monthly
    WHERE period_date >= date_trunc('month', month_from)
      AND period_date <= date_trunc('month', month_to)
  )
  SELECT COALESCE((SELECT factor FROM monthly_factors), 1.0);
$$;

-- 9. Función genérica de factor por tipo de índice
CREATE OR REPLACE FUNCTION pms_index_factor(
  indice_tipo text,
  month_from date,
  month_to date
)
RETURNS numeric LANGUAGE plpgsql AS $$
BEGIN
  CASE indice_tipo
    WHEN 'IPC' THEN
      RETURN pms_ipc_factor(month_from, month_to);
    WHEN 'ICL' THEN
      RAISE EXCEPTION 'ICL index not yet implemented';
    WHEN 'UVA' THEN
      RAISE EXCEPTION 'UVA index not yet implemented';
    ELSE
      RETURN 1.0;
  END CASE;
END;
$$;