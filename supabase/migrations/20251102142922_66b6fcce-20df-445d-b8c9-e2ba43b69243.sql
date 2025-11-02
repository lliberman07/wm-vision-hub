-- Fix pms_next_adjustment_date to correctly handle first adjustment
-- STEP 1: Fix function signature of pms_ipc_factor to accept TIMESTAMP or DATE

CREATE OR REPLACE FUNCTION pms_ipc_factor(month_from TIMESTAMP, month_to TIMESTAMP)
RETURNS numeric
LANGUAGE sql
AS $$
  WITH monthly_factors AS (
    SELECT exp(sum(ln(1 + pct/100.0))) as factor
    FROM pms_index_ipc_monthly
    WHERE period_date >= date_trunc('month', month_from::date)
      AND period_date <= date_trunc('month', month_to::date)
  )
  SELECT COALESCE((SELECT factor FROM monthly_factors), 1.0);
$$;

-- Also create DATE version for direct compatibility
CREATE OR REPLACE FUNCTION pms_ipc_factor(month_from DATE, month_to DATE)
RETURNS numeric
LANGUAGE sql
AS $$
  WITH monthly_factors AS (
    SELECT exp(sum(ln(1 + pct/100.0))) as factor
    FROM pms_index_ipc_monthly
    WHERE period_date >= date_trunc('month', month_from)
      AND period_date <= date_trunc('month', month_to)
  )
  SELECT COALESCE((SELECT factor FROM monthly_factors), 1.0);
$$;

-- STEP 2: Now fix pms_next_adjustment_date to correctly handle first adjustment
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
  -- If reference date is before the first adjustment date, return the first adjustment date
  -- FIXED: Previously returned d + step, which skipped the first adjustment
  IF ref_date < d THEN
    RETURN d;
  END IF;
  
  -- If past the first adjustment, calculate next one
  LOOP
    d := d + (step || ' months')::interval;
    IF d > ref_date THEN
      RETURN d;
    END IF;
  END LOOP;
END;
$$;