-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS trigger_validate_payment_percentages ON pms_contract_payment_methods;
DROP TRIGGER IF EXISTS trigger_distribute_payment ON pms_payments;
DROP TRIGGER IF EXISTS trigger_update_cashflow_on_payment ON pms_payments;
DROP TRIGGER IF EXISTS trigger_update_cashflow_on_expense ON pms_expenses;

-- Eliminar funciones existentes si existen
DROP FUNCTION IF EXISTS validate_payment_method_percentages();
DROP FUNCTION IF EXISTS distribute_payment_to_owners();
DROP FUNCTION IF EXISTS update_property_cashflow();
DROP FUNCTION IF EXISTS update_property_cashflow_on_expense();
DROP FUNCTION IF EXISTS apply_automatic_adjustments();

-- Trigger 1: Validar suma de porcentajes en métodos de pago
CREATE FUNCTION validate_payment_method_percentages()
RETURNS TRIGGER AS $$
DECLARE
  total_percentage NUMERIC;
BEGIN
  SELECT COALESCE(SUM(percentage), 0)
  INTO total_percentage
  FROM pms_contract_payment_methods
  WHERE contract_id = NEW.contract_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF total_percentage + NEW.percentage > 100 THEN
    RAISE EXCEPTION 'La suma de porcentajes no puede exceder 100 por ciento';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_validate_payment_percentages
BEFORE INSERT OR UPDATE ON pms_contract_payment_methods
FOR EACH ROW
EXECUTE FUNCTION validate_payment_method_percentages();

-- Trigger 2: Distribuir pagos automáticamente entre propietarios
CREATE FUNCTION distribute_payment_to_owners()
RETURNS TRIGGER AS $$
DECLARE
  owner_record RECORD;
  total_amount NUMERIC;
BEGIN
  IF NEW.status = 'paid' AND NEW.paid_amount > 0 THEN
    DELETE FROM pms_payment_distributions WHERE payment_id = NEW.id;
    
    total_amount := NEW.paid_amount;
    
    FOR owner_record IN
      SELECT op.owner_id, op.share_percent, op.tenant_id
      FROM pms_owner_properties op
      JOIN pms_contracts c ON c.property_id = op.property_id
      WHERE c.id = NEW.contract_id
        AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
    LOOP
      INSERT INTO pms_payment_distributions (
        payment_id, owner_id, tenant_id,
        amount, share_percent, currency
      ) VALUES (
        NEW.id, owner_record.owner_id, owner_record.tenant_id,
        total_amount * (owner_record.share_percent / 100),
        owner_record.share_percent, NEW.currency
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_distribute_payment
AFTER INSERT OR UPDATE OF status, paid_amount ON pms_payments
FOR EACH ROW
EXECUTE FUNCTION distribute_payment_to_owners();

-- Trigger 3: Actualizar cashflow automáticamente
CREATE FUNCTION update_property_cashflow()
RETURNS TRIGGER AS $$
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
  
  SELECT COALESCE(SUM(paid_amount), 0)
  INTO total_income_calc
  FROM pms_payments
  WHERE contract_id = NEW.contract_id
    AND status = 'paid'
    AND TO_CHAR(COALESCE(paid_date, due_date), 'YYYY-MM') = period_text;
  
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
  ON CONFLICT (property_id, period) DO UPDATE
  SET total_income = EXCLUDED.total_income,
      total_expenses = EXCLUDED.total_expenses,
      net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_cashflow_on_payment
AFTER INSERT OR UPDATE OF paid_amount, status ON pms_payments
FOR EACH ROW
EXECUTE FUNCTION update_property_cashflow();

-- Trigger 4: Actualizar cashflow cuando hay gastos
CREATE FUNCTION update_property_cashflow_on_expense()
RETURNS TRIGGER AS $$
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
  ON CONFLICT (property_id, period) DO UPDATE
  SET total_expenses = EXCLUDED.total_expenses,
      net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_cashflow_on_expense
AFTER INSERT OR UPDATE OF amount ON pms_expenses
FOR EACH ROW
EXECUTE FUNCTION update_property_cashflow_on_expense();

-- Función manual para aplicar ajustes automáticos
CREATE FUNCTION apply_automatic_adjustments()
RETURNS void AS $$
DECLARE
  contract_record RECORD;
  index_value NUMERIC;
  variation NUMERIC;
  new_amount_a NUMERIC;
  new_amount_b NUMERIC;
BEGIN
  FOR contract_record IN
    SELECT * FROM pms_contracts
    WHERE adjustment_type IS NOT NULL
      AND adjustment_type != 'none'
      AND adjustment_type != 'fixed'
      AND fecha_primer_ajuste IS NOT NULL
      AND (ultimo_ajuste IS NULL OR ultimo_ajuste + 
        CASE frecuencia_ajuste
          WHEN 'Mensual' THEN INTERVAL '1 month'
          WHEN 'Trimestral' THEN INTERVAL '3 months'
          WHEN 'Semestral' THEN INTERVAL '6 months'
          WHEN 'Anual' THEN INTERVAL '12 months'
          ELSE INTERVAL '1 month'
        END <= CURRENT_DATE)
      AND status = 'active'
  LOOP
    SELECT value INTO index_value
    FROM pms_economic_indices
    WHERE index_type = contract_record.indice_ajuste
      AND tenant_id = contract_record.tenant_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF index_value IS NOT NULL THEN
      variation := index_value;
      new_amount_a := COALESCE(contract_record.monto_ajustado_actual_a, contract_record.monto_a, contract_record.monthly_rent) * (1 + variation/100);
      new_amount_b := COALESCE(contract_record.monto_ajustado_actual_b, contract_record.monto_b, 0) * (1 + variation/100);
      
      INSERT INTO pms_contract_adjustments (
        contract_id, tenant_id, application_date, index_type,
        previous_amount, variation_percent, new_amount, item
      ) VALUES (
        contract_record.id, contract_record.tenant_id, CURRENT_DATE,
        contract_record.indice_ajuste, COALESCE(contract_record.monto_ajustado_actual_a, contract_record.monto_a, contract_record.monthly_rent),
        variation, new_amount_a, 'A'
      );
      
      IF new_amount_b > 0 THEN
        INSERT INTO pms_contract_adjustments (
          contract_id, tenant_id, application_date, index_type,
          previous_amount, variation_percent, new_amount, item
        ) VALUES (
          contract_record.id, contract_record.tenant_id, CURRENT_DATE,
          contract_record.indice_ajuste, COALESCE(contract_record.monto_ajustado_actual_b, contract_record.monto_b, 0),
          variation, new_amount_b, 'B'
        );
      END IF;
      
      UPDATE pms_contracts
      SET monto_ajustado_actual_a = new_amount_a,
          monto_ajustado_actual_b = new_amount_b,
          ultimo_ajuste = CURRENT_DATE
      WHERE id = contract_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;