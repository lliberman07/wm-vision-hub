-- Fix the search path security warning for the generate_reference_number function
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'SIM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT, 13, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';