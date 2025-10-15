-- Crear triggers para actualizar automáticamente el flujo de caja

-- Trigger para actualizar flujo de caja cuando se registra o modifica un pago
CREATE OR REPLACE TRIGGER update_cashflow_on_payment
AFTER INSERT OR UPDATE ON pms_payments
FOR EACH ROW
EXECUTE FUNCTION update_property_cashflow();

-- Trigger para actualizar flujo de caja cuando se registra o modifica un gasto
CREATE OR REPLACE TRIGGER update_cashflow_on_expense
AFTER INSERT OR UPDATE ON pms_expenses
FOR EACH ROW
EXECUTE FUNCTION update_property_cashflow_on_expense();

-- Regenerar flujo de caja para todos los pagos existentes
DO $$
DECLARE
  payment_rec RECORD;
BEGIN
  FOR payment_rec IN
    SELECT DISTINCT
      c.property_id,
      p.tenant_id,
      TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') as period,
      p.currency
    FROM pms_payments p
    JOIN pms_contracts c ON c.id = p.contract_id
    WHERE p.status = 'paid'
  LOOP
    -- Calcular ingresos del período
    WITH income AS (
      SELECT COALESCE(SUM(p.paid_amount), 0) as total_income
      FROM pms_payments p
      JOIN pms_contracts c ON c.id = p.contract_id
      WHERE c.property_id = payment_rec.property_id
        AND p.status = 'paid'
        AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = payment_rec.period
    ),
    expenses AS (
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM pms_expenses
      WHERE property_id = payment_rec.property_id
        AND TO_CHAR(expense_date, 'YYYY-MM') = payment_rec.period
    )
    INSERT INTO pms_cashflow_property (
      property_id,
      tenant_id,
      period,
      currency,
      total_income,
      total_expenses,
      net_result
    )
    SELECT
      payment_rec.property_id,
      payment_rec.tenant_id,
      payment_rec.period,
      payment_rec.currency,
      i.total_income,
      e.total_expenses,
      i.total_income - e.total_expenses
    FROM income i, expenses e
    ON CONFLICT (property_id, period, currency) DO UPDATE
    SET total_income = EXCLUDED.total_income,
        total_expenses = EXCLUDED.total_expenses,
        net_result = EXCLUDED.net_result,
        updated_at = NOW();
  END LOOP;
END $$;