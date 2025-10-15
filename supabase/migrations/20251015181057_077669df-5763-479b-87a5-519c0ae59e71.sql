-- Corregir función para evitar error de DELETE sin WHERE
-- Cambiamos DELETE simple por DELETE con WHERE true

CREATE OR REPLACE FUNCTION public.recalculate_all_cashflow()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contract_rec RECORD;
  period_rec RECORD;
  total_income_calc NUMERIC;
  total_expenses_calc NUMERIC;
BEGIN
  -- Limpiar cashflow existente usando WHERE true para evitar error
  DELETE FROM pms_cashflow_property WHERE true;
  
  -- Para cada contrato activo
  FOR contract_rec IN
    SELECT DISTINCT 
      c.id as contract_id,
      c.tenant_id,
      c.property_id,
      c.currency
    FROM pms_contracts c
    WHERE c.status IN ('active', 'expired', 'cancelled')
  LOOP
    -- Para cada período con pagos
    FOR period_rec IN
      SELECT DISTINCT 
        TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') as period
      FROM pms_payments p
      WHERE p.contract_id = contract_rec.contract_id
        AND p.status = 'paid'
      ORDER BY period
    LOOP
      -- Calcular ingresos solo de pagos vinculados a schedule items
      SELECT COALESCE(SUM(DISTINCT p.paid_amount), 0)
      INTO total_income_calc
      FROM pms_payments p
      WHERE p.contract_id = contract_rec.contract_id
        AND p.status = 'paid'
        AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = period_rec.period
        AND EXISTS (
          SELECT 1 
          FROM pms_payment_schedule_items psi 
          WHERE psi.payment_id = p.id
        );
      
      -- Calcular gastos del período
      SELECT COALESCE(SUM(amount), 0)
      INTO total_expenses_calc
      FROM pms_expenses
      WHERE property_id = contract_rec.property_id
        AND TO_CHAR(expense_date, 'YYYY-MM') = period_rec.period;
      
      -- Insertar solo si hay ingresos o gastos
      IF total_income_calc > 0 OR total_expenses_calc > 0 THEN
        INSERT INTO pms_cashflow_property (
          property_id, tenant_id, period, currency,
          total_income, total_expenses, net_result
        ) VALUES (
          contract_rec.property_id,
          contract_rec.tenant_id,
          period_rec.period,
          contract_rec.currency,
          total_income_calc,
          total_expenses_calc,
          total_income_calc - total_expenses_calc
        )
        ON CONFLICT (property_id, period, currency) DO UPDATE
        SET total_income = EXCLUDED.total_income,
            total_expenses = EXCLUDED.total_expenses,
            net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
            updated_at = NOW();
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Cashflow recalculado exitosamente';
END;
$function$;