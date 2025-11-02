-- Fix pms_next_adjustment_date to correctly handle first adjustment
-- The function was incorrectly adding an extra period when ref_date was before start_date

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