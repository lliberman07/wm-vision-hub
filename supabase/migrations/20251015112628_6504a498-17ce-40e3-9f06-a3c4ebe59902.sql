-- Actualizar la función update_property_cashflow_on_expense para usar el constraint correcto
CREATE OR REPLACE FUNCTION public.update_property_cashflow_on_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  period_text TEXT;
  total_income_calc NUMERIC;
  total_expenses_calc NUMERIC;
BEGIN
  period_text := TO_CHAR(NEW.expense_date, 'YYYY-MM');
  
  SELECT COALESCE(SUM(p.paid_amount), 0)
  INTO total_income_calc
  FROM pms_payments p
  JOIN pms_contracts c ON c.id = p.contract_id
  WHERE c.property_id = NEW.property_id
    AND p.status = 'paid'
    AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_text;
  
  SELECT COALESCE(SUM(amount), 0)
  INTO total_expenses_calc
  FROM pms_expenses
  WHERE property_id = NEW.property_id
    AND TO_CHAR(expense_date, 'YYYY-MM') = period_text;
  
  INSERT INTO pms_cashflow_property (
    property_id, tenant_id, period, currency,
    total_income, total_expenses, net_result
  ) VALUES (
    NEW.property_id, NEW.tenant_id, period_text, NEW.currency,
    total_income_calc, total_expenses_calc, total_income_calc - total_expenses_calc
  )
  ON CONFLICT (property_id, period, currency) DO UPDATE
  SET total_expenses = EXCLUDED.total_expenses,
      net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
      updated_at = NOW();
  
  RETURN NEW;
END;
$function$;