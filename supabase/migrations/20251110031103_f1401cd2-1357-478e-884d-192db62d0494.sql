-- Corregir cálculo de cashflow: eliminar DISTINCT y solo contar reembolsos pagados

CREATE OR REPLACE FUNCTION public.update_property_cashflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  period_text TEXT;
  property_uuid UUID;
  total_income_calc NUMERIC;
  total_expenses_calc NUMERIC;
  reimbursable_expenses_calc NUMERIC;
BEGIN
  period_text := TO_CHAR(COALESCE(NEW.paid_date, NEW.due_date), 'YYYY-MM');
  
  SELECT property_id INTO property_uuid
  FROM pms_contracts
  WHERE id = NEW.contract_id;
  
  -- CORREGIDO: Calcular ingresos sumando TODOS los pagos (sin DISTINCT)
  -- El DISTINCT estaba causando que solo se contara un pago cuando había múltiples del mismo monto
  SELECT COALESCE(SUM(p.paid_amount), 0)
  INTO total_income_calc
  FROM pms_payments p
  JOIN pms_payment_schedule_items psi ON psi.payment_id = p.id
  WHERE p.contract_id = NEW.contract_id
    AND p.status = 'paid'
    AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_text
    AND psi.expense_id IS NULL; -- Excluir reembolsos (se cuentan aparte)
  
  -- CORREGIDO: Solo contar reembolsables que están PAGADOS
  -- Antes sumaba todos los gastos reembolsables sin importar si estaban pagados o no
  SELECT COALESCE(SUM(p.paid_amount), 0)
  INTO reimbursable_expenses_calc
  FROM pms_payments p
  JOIN pms_payment_schedule_items psi ON psi.payment_id = p.id
  WHERE p.contract_id = NEW.contract_id
    AND p.status = 'paid'
    AND psi.expense_id IS NOT NULL
    AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_text;
  
  -- Calcular gastos: solo gastos NO reembolsables
  SELECT COALESCE(SUM(amount), 0)
  INTO total_expenses_calc
  FROM pms_expenses
  WHERE contract_id = NEW.contract_id
    AND (is_reimbursable = false OR is_reimbursable IS NULL)
    AND TO_CHAR(expense_date, 'YYYY-MM') = period_text;
  
  -- Los reembolsables pagados se suman a los ingresos
  total_income_calc := total_income_calc + reimbursable_expenses_calc;
  
  INSERT INTO pms_cashflow_property (
    property_id, contract_id, tenant_id, period, currency,
    total_income, total_expenses, net_result,
    detail_json
  ) VALUES (
    property_uuid, NEW.contract_id, NEW.tenant_id, period_text, NEW.currency,
    total_income_calc, total_expenses_calc, total_income_calc - total_expenses_calc,
    jsonb_build_object(
      'reimbursable_expenses_as_income', reimbursable_expenses_calc,
      'regular_income', total_income_calc - reimbursable_expenses_calc,
      'regular_expenses', total_expenses_calc
    )
  )
  ON CONFLICT (contract_id, period, currency) DO UPDATE
  SET total_income = EXCLUDED.total_income,
      total_expenses = EXCLUDED.total_expenses,
      net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
      detail_json = EXCLUDED.detail_json,
      updated_at = NOW();
  
  RETURN NEW;
END;
$function$;

-- Aplicar las mismas correcciones a la función de gastos
CREATE OR REPLACE FUNCTION public.update_property_cashflow_on_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- CORREGIDO: Calcular ingresos sumando TODOS los pagos (sin DISTINCT)
  SELECT COALESCE(SUM(p.paid_amount), 0)
  INTO total_income_calc
  FROM pms_payments p
  JOIN pms_payment_schedule_items psi ON psi.payment_id = p.id
  WHERE p.contract_id = NEW.contract_id
    AND p.status = 'paid'
    AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_text
    AND psi.expense_id IS NULL; -- Excluir reembolsos
  
  -- CORREGIDO: Solo contar reembolsables que están PAGADOS
  SELECT COALESCE(SUM(p.paid_amount), 0)
  INTO reimbursable_expenses_calc
  FROM pms_payments p
  JOIN pms_payment_schedule_items psi ON psi.payment_id = p.id
  WHERE p.contract_id = NEW.contract_id
    AND p.status = 'paid'
    AND psi.expense_id IS NOT NULL
    AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_text;
  
  -- Calcular gastos regulares (NO reembolsables)
  SELECT COALESCE(SUM(amount), 0)
  INTO total_expenses_calc
  FROM pms_expenses
  WHERE contract_id = NEW.contract_id
    AND (is_reimbursable = false OR is_reimbursable IS NULL)
    AND TO_CHAR(expense_date, 'YYYY-MM') = period_text;
  
  -- Los reembolsables pagados se suman a los ingresos
  total_income_calc := total_income_calc + reimbursable_expenses_calc;
  
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

COMMENT ON FUNCTION public.update_property_cashflow() IS 
'Actualiza el cashflow de la propiedad. Suma TODOS los pagos (no usa DISTINCT) y solo cuenta reembolsos PAGADOS como ingresos.';

COMMENT ON FUNCTION public.update_property_cashflow_on_expense() IS 
'Actualiza el cashflow cuando se registra/modifica un gasto. Solo cuenta reembolsos PAGADOS como ingresos.';