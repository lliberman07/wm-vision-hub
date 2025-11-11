-- Modificar función update_property_cashflow para soportar múltiples monedas
CREATE OR REPLACE FUNCTION public.update_property_cashflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  period_text TEXT;
  property_uuid UUID;
  tenant_uuid UUID;
  contract_uuid UUID;
  currency_code TEXT;
  total_income_calc NUMERIC;
  reimbursable_calc NUMERIC;
  total_expenses_calc NUMERIC;
BEGIN
  period_text := TO_CHAR(COALESCE(NEW.paid_date, NEW.due_date), 'YYYY-MM');
  contract_uuid := NEW.contract_id;
  
  SELECT property_id, tenant_id INTO property_uuid, tenant_uuid
  FROM pms_contracts
  WHERE id = contract_uuid;
  
  -- Calcular para cada moneda de pago (ARS y USD) separadamente
  FOR currency_code IN (
    SELECT DISTINCT currency 
    FROM pms_payments 
    WHERE contract_id = contract_uuid
      AND status = 'paid'
      AND TO_CHAR(COALESCE(paid_date, due_date), 'YYYY-MM') = period_text
  ) LOOP
    
    -- Ingresos en esta moneda específica (ingresos regulares, no reembolsos)
    SELECT COALESCE(SUM(p.paid_amount), 0) INTO total_income_calc
    FROM pms_payments p
    WHERE p.contract_id = contract_uuid
      AND p.status = 'paid'
      AND p.currency = currency_code
      AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_text
      AND NOT EXISTS (
        SELECT 1 FROM pms_payment_schedule_items psi
        WHERE psi.id = p.schedule_item_id
          AND psi.expense_id IS NOT NULL
      );
    
    -- Reembolsos en esta moneda
    SELECT COALESCE(SUM(p.paid_amount), 0) INTO reimbursable_calc
    FROM pms_payments p
    JOIN pms_payment_schedule_items psi ON psi.id = p.schedule_item_id
    WHERE p.contract_id = contract_uuid
      AND p.status = 'paid'
      AND p.currency = currency_code
      AND psi.expense_id IS NOT NULL
      AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_text;
    
    -- Gastos en la misma moneda
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses_calc
    FROM pms_expenses
    WHERE contract_id = contract_uuid
      AND currency = currency_code
      AND (is_reimbursable = false OR is_reimbursable IS NULL)
      AND TO_CHAR(expense_date, 'YYYY-MM') = period_text;
    
    -- Insertar o actualizar cashflow para esta moneda
    INSERT INTO pms_cashflow_property (
      property_id, contract_id, tenant_id, period, currency,
      total_income, total_expenses, net_result,
      detail_json
    )
    VALUES (
      property_uuid, 
      contract_uuid, 
      tenant_uuid, 
      period_text, 
      currency_code,
      total_income_calc + reimbursable_calc,
      total_expenses_calc,
      (total_income_calc + reimbursable_calc) - total_expenses_calc,
      jsonb_build_object(
        'reimbursable_expenses_as_income', reimbursable_calc,
        'regular_income', total_income_calc,
        'regular_expenses', total_expenses_calc
      )
    )
    ON CONFLICT (contract_id, period, currency) DO UPDATE
    SET total_income = EXCLUDED.total_income,
        total_expenses = EXCLUDED.total_expenses,
        net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
        detail_json = EXCLUDED.detail_json,
        updated_at = NOW();
  
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Modificar función update_property_cashflow_on_expense para soportar múltiples monedas
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
  contract_uuid UUID;
  currency_code TEXT;
  total_income_calc NUMERIC;
  reimbursable_calc NUMERIC;
  total_expenses_calc NUMERIC;
BEGIN
  period_text := TO_CHAR(COALESCE(NEW.expense_date, CURRENT_DATE), 'YYYY-MM');
  contract_uuid := NEW.contract_id;
  
  SELECT property_id, tenant_id INTO property_uuid, tenant_uuid
  FROM pms_contracts
  WHERE id = contract_uuid;
  
  currency_code := NEW.currency;
  
  -- Ingresos en esta moneda
  SELECT COALESCE(SUM(p.paid_amount), 0) INTO total_income_calc
  FROM pms_payments p
  WHERE p.contract_id = contract_uuid
    AND p.status = 'paid'
    AND p.currency = currency_code
    AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_text
    AND NOT EXISTS (
      SELECT 1 FROM pms_payment_schedule_items psi
      WHERE psi.id = p.schedule_item_id
        AND psi.expense_id IS NOT NULL
    );
  
  -- Reembolsos en esta moneda
  SELECT COALESCE(SUM(p.paid_amount), 0) INTO reimbursable_calc
  FROM pms_payments p
  JOIN pms_payment_schedule_items psi ON psi.id = p.schedule_item_id
  WHERE p.contract_id = contract_uuid
    AND p.status = 'paid'
    AND p.currency = currency_code
    AND psi.expense_id IS NOT NULL
    AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_text;
  
  -- Gastos en la misma moneda
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses_calc
  FROM pms_expenses
  WHERE contract_id = contract_uuid
    AND currency = currency_code
    AND (is_reimbursable = false OR is_reimbursable IS NULL)
    AND TO_CHAR(expense_date, 'YYYY-MM') = period_text;
  
  -- Insertar o actualizar cashflow para esta moneda
  INSERT INTO pms_cashflow_property (
    property_id, contract_id, tenant_id, period, currency,
    total_income, total_expenses, net_result,
    detail_json
  )
  VALUES (
    property_uuid, 
    contract_uuid, 
    tenant_uuid, 
    period_text, 
    currency_code,
    total_income_calc + reimbursable_calc,
    total_expenses_calc,
    (total_income_calc + reimbursable_calc) - total_expenses_calc,
    jsonb_build_object(
      'reimbursable_expenses_as_income', reimbursable_calc,
      'regular_income', total_income_calc,
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