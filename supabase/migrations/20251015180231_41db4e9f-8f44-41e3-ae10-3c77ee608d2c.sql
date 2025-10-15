-- Actualizar trigger para calcular cashflow solo con pagos vinculados a schedule items
-- Esto evita contar pagos duplicados que no están vinculados

CREATE OR REPLACE FUNCTION public.update_property_cashflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  period_text TEXT;
  property_uuid UUID;
  total_income_calc NUMERIC;
  total_expenses_calc NUMERIC;
BEGIN
  period_text := TO_CHAR(COALESCE(NEW.paid_date, NEW.due_date), 'YYYY-MM');
  
  SELECT property_id INTO property_uuid
  FROM pms_contracts
  WHERE id = NEW.contract_id;
  
  -- CAMBIO CRÍTICO: Solo sumar pagos que están vinculados a schedule items
  -- Esto evita contar pagos duplicados que no fueron vinculados correctamente
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
  
  SELECT COALESCE(SUM(amount), 0)
  INTO total_expenses_calc
  FROM pms_expenses
  WHERE property_id = property_uuid
    AND TO_CHAR(expense_date, 'YYYY-MM') = period_text;
  
  INSERT INTO pms_cashflow_property (
    property_id, tenant_id, period, currency,
    total_income, total_expenses, net_result
  ) VALUES (
    property_uuid, NEW.tenant_id, period_text, NEW.currency,
    total_income_calc, total_expenses_calc, total_income_calc - total_expenses_calc
  )
  ON CONFLICT (property_id, period, currency) DO UPDATE
  SET total_income = EXCLUDED.total_income,
      total_expenses = EXCLUDED.total_expenses,
      net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
      updated_at = NOW();
  
  RETURN NEW;
END;
$function$;