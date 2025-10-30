-- Corregir función update_property_cashflow para sumar correctamente pagos múltiples
-- Bug: SUM(DISTINCT p.paid_amount) eliminaba pagos con montos duplicados
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
BEGIN
  period_text := TO_CHAR(COALESCE(NEW.paid_date, NEW.due_date), 'YYYY-MM');
  
  SELECT property_id INTO property_uuid
  FROM pms_contracts
  WHERE id = NEW.contract_id;
  
  -- CORRECCIÓN: Remover DISTINCT para contar todos los pagos correctamente
  SELECT COALESCE(SUM(p.paid_amount), 0)
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
  WHERE contract_id = NEW.contract_id
    AND TO_CHAR(expense_date, 'YYYY-MM') = period_text;
  
  INSERT INTO pms_cashflow_property (
    property_id, contract_id, tenant_id, period, currency,
    total_income, total_expenses, net_result
  ) VALUES (
    property_uuid, NEW.contract_id, NEW.tenant_id, period_text, NEW.currency,
    total_income_calc, total_expenses_calc, total_income_calc - total_expenses_calc
  )
  ON CONFLICT (contract_id, period, currency) DO UPDATE
  SET total_income = EXCLUDED.total_income,
      total_expenses = EXCLUDED.total_expenses,
      net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
      updated_at = NOW();
  
  RETURN NEW;
END;
$function$;

-- Recalcular cashflow existente para corregir datos históricos
DO $$
DECLARE
  payment_record RECORD;
BEGIN
  FOR payment_record IN 
    SELECT DISTINCT contract_id, tenant_id, currency, 
           TO_CHAR(COALESCE(paid_date, due_date), 'YYYY-MM') as period
    FROM pms_payments
    WHERE status = 'paid'
  LOOP
    DECLARE
      property_uuid UUID;
      total_income_calc NUMERIC;
      total_expenses_calc NUMERIC;
    BEGIN
      SELECT property_id INTO property_uuid
      FROM pms_contracts
      WHERE id = payment_record.contract_id;
      
      -- Calcular ingresos SIN DISTINCT
      SELECT COALESCE(SUM(p.paid_amount), 0)
      INTO total_income_calc
      FROM pms_payments p
      WHERE p.contract_id = payment_record.contract_id
        AND p.status = 'paid'
        AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = payment_record.period
        AND EXISTS (
          SELECT 1 
          FROM pms_payment_schedule_items psi 
          WHERE psi.payment_id = p.id
        );
      
      SELECT COALESCE(SUM(amount), 0)
      INTO total_expenses_calc
      FROM pms_expenses
      WHERE contract_id = payment_record.contract_id
        AND TO_CHAR(expense_date, 'YYYY-MM') = payment_record.period;
      
      INSERT INTO pms_cashflow_property (
        property_id, contract_id, tenant_id, period, currency,
        total_income, total_expenses, net_result
      ) VALUES (
        property_uuid, payment_record.contract_id, payment_record.tenant_id, 
        payment_record.period, payment_record.currency,
        total_income_calc, total_expenses_calc, total_income_calc - total_expenses_calc
      )
      ON CONFLICT (contract_id, period, currency) DO UPDATE
      SET total_income = EXCLUDED.total_income,
          total_expenses = EXCLUDED.total_expenses,
          net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
          updated_at = NOW();
    END;
  END LOOP;
END $$;