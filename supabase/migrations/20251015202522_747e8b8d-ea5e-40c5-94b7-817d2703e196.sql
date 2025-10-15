-- Corregir función de validación de porcentajes para considerar el item
CREATE OR REPLACE FUNCTION public.validate_payment_method_percentages()
RETURNS TRIGGER AS $$
DECLARE
  total_percentage NUMERIC;
BEGIN
  -- Calcular suma de porcentajes para este contrato Y ESTE ITEM específico
  SELECT COALESCE(SUM(percentage), 0)
  INTO total_percentage
  FROM pms_contract_payment_methods
  WHERE contract_id = NEW.contract_id
    AND item = NEW.item  -- Filtrar por item específico (A o B)
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF total_percentage + NEW.percentage > 100 THEN
    RAISE EXCEPTION 'La suma de porcentajes para el item % no puede exceder 100 por ciento', NEW.item;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;