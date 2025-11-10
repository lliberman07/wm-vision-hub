-- Fix update_property_cashflow_on_expense function to use correct unique constraint
CREATE OR REPLACE FUNCTION public.update_property_cashflow_on_expense()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  period_text TEXT;
  property_uuid UUID;
  tenant_uuid UUID;
  contract_currency TEXT;
  total_income_calc NUMERIC;
  total_expenses_calc NUMERIC;
  reimbursable_expenses_calc NUMERIC;
BEGIN
  -- Si no hay contrato asociado, salir temprano
  IF NEW.contract_id IS NULL THEN
    RETURN NEW;
  END IF;

  period_text := TO_CHAR(NEW.expense_date, 'YYYY-MM');
  
  -- Obtener datos del contrato
  SELECT c.property_id, c.tenant_id, c.currency
  INTO property_uuid, tenant_uuid, contract_currency
  FROM pms_contracts c
  WHERE c.id = NEW.contract_id;
  
  -- Calcular ingresos: pagos del inquilino
  SELECT COALESCE(SUM(DISTINCT p.paid_amount), 0)
  INTO total_income_calc
  FROM pms_payments p
  WHERE p.contract_id = NEW.contract_id
    AND p.status = 'paid'
    AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_text
    AND EXISTS (
      SELECT 1 
      FROM pms_payment_schedule_items psi 
      WHERE psi.payment_id = p.id
    );
  
  -- Calcular gastos reembolsables (estos se agregan como ingresos)
  SELECT COALESCE(SUM(e.amount), 0)
  INTO reimbursable_expenses_calc
  FROM pms_expenses e
  WHERE e.contract_id = NEW.contract_id
    AND e.is_reimbursable = true
    AND TO_CHAR(e.expense_date, 'YYYY-MM') = period_text;
  
  -- Calcular gastos regulares (NO reembolsables)
  SELECT COALESCE(SUM(amount), 0)
  INTO total_expenses_calc
  FROM pms_expenses
  WHERE contract_id = NEW.contract_id
    AND (is_reimbursable = false OR is_reimbursable IS NULL)
    AND TO_CHAR(expense_date, 'YYYY-MM') = period_text;
  
  -- Los reembolsables se suman a los ingresos
  total_income_calc := total_income_calc + reimbursable_expenses_calc;
  
  -- FIX: Use property_id instead of contract_id in ON CONFLICT to match unique constraint
  INSERT INTO pms_cashflow_property (
    property_id, contract_id, tenant_id, period, currency,
    total_income, total_expenses, net_result,
    detail_json
  ) VALUES (
    property_uuid, NEW.contract_id, tenant_uuid, period_text, contract_currency,
    total_income_calc, total_expenses_calc, total_income_calc - total_expenses_calc,
    jsonb_build_object(
      'reimbursable_expenses_as_income', reimbursable_expenses_calc,
      'regular_income', total_income_calc - reimbursable_expenses_calc,
      'regular_expenses', total_expenses_calc
    )
  )
  ON CONFLICT (property_id, period, currency) DO UPDATE
  SET total_income = EXCLUDED.total_income,
      total_expenses = EXCLUDED.total_expenses,
      net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
      detail_json = EXCLUDED.detail_json,
      contract_id = EXCLUDED.contract_id,
      updated_at = NOW();
  
  RETURN NEW;
END;
$function$;