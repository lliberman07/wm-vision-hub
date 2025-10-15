-- ARQUITECTURA MEJORADA: REPORTES POR CONTRATO
-- ===============================================

-- 1. Agregar contract_id a pms_cashflow_property
ALTER TABLE public.pms_cashflow_property
ADD COLUMN contract_id uuid REFERENCES pms_contracts(id);

-- 2. Poblar contract_id en registros existentes de cashflow
UPDATE public.pms_cashflow_property cf
SET contract_id = (
  SELECT c.id
  FROM pms_contracts c
  JOIN pms_payments p ON p.contract_id = c.id
  WHERE c.property_id = cf.property_id
    AND TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') = cf.period
  LIMIT 1
);

-- 3. Eliminar constraint único anterior y crear uno nuevo por contrato
ALTER TABLE public.pms_cashflow_property
DROP CONSTRAINT IF EXISTS pms_cashflow_property_property_id_period_currency_key;

-- 4. Crear nuevo constraint único: (contract_id, period, currency)
ALTER TABLE public.pms_cashflow_property
ADD CONSTRAINT pms_cashflow_property_contract_id_period_currency_key 
UNIQUE (contract_id, period, currency);

-- 5. Agregar contract_id a pms_payment_distributions
ALTER TABLE public.pms_payment_distributions
ADD COLUMN contract_id uuid REFERENCES pms_contracts(id);

-- 6. Poblar contract_id en distribuciones existentes desde pms_payments
UPDATE public.pms_payment_distributions pd
SET contract_id = p.contract_id
FROM pms_payments p
WHERE pd.payment_id = p.id;

-- 7. Crear índices para mejorar performance de queries
CREATE INDEX IF NOT EXISTS idx_cashflow_contract_id ON pms_cashflow_property(contract_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_period ON pms_cashflow_property(period);
CREATE INDEX IF NOT EXISTS idx_payment_dist_contract_id ON pms_payment_distributions(contract_id);

-- 8. Actualizar función cancel_contract para marcar schedule items como cancelados
CREATE OR REPLACE FUNCTION public.cancel_contract(
  contract_id_param uuid,
  cancellation_date_param date,
  cancellation_reason_param text,
  cancelled_by_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  contract_record RECORD;
  property_maintenance_status BOOLEAN;
BEGIN
  SELECT * INTO contract_record
  FROM pms_contracts
  WHERE id = contract_id_param
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado o no está activo';
  END IF;

  IF cancellation_date_param < contract_record.start_date THEN
    RAISE EXCEPTION 'La fecha de cancelación no puede ser anterior a la fecha de inicio del contrato';
  END IF;

  IF cancellation_date_param > contract_record.end_date THEN
    RAISE EXCEPTION 'La fecha de cancelación no puede ser posterior a la fecha de fin del contrato';
  END IF;

  -- Actualizar contrato
  UPDATE pms_contracts
  SET status = 'cancelled',
      cancelled_at = cancellation_date_param,
      cancellation_reason = cancellation_reason_param,
      cancelled_by = cancelled_by_param,
      updated_at = NOW()
  WHERE id = contract_id_param;

  -- Cancelar pagos futuros
  UPDATE pms_payments
  SET status = 'cancelled',
      notes = COALESCE(notes || E'\n', '') || 'Cancelado por cancelación de contrato el ' || cancellation_date_param::TEXT,
      updated_at = NOW()
  WHERE contract_id = contract_id_param
    AND status = 'pending'
    AND due_date >= cancellation_date_param;

  -- NUEVO: Cancelar schedule items futuros
  UPDATE pms_payment_schedule_items
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE contract_id = contract_id_param
    AND period_date >= cancellation_date_param
    AND status IN ('pending', 'overdue');

  -- Verificar estado de propiedad
  SELECT (status = 'maintenance') INTO property_maintenance_status
  FROM pms_properties
  WHERE id = contract_record.property_id;

  IF NOT property_maintenance_status THEN
    UPDATE pms_properties
    SET status = 'available',
        updated_at = NOW()
    WHERE id = contract_record.property_id;
  END IF;

  -- Log de auditoría
  INSERT INTO pms_contract_adjustments (
    contract_id, tenant_id, application_date,
    index_type, previous_amount, variation_percent,
    new_amount, item, audit_json
  ) VALUES (
    contract_id_param, contract_record.tenant_id, cancellation_date_param,
    'CANCELACION', 0, 0, 0, 'CANCELACION',
    jsonb_build_object(
      'cancellation_reason', cancellation_reason_param,
      'cancelled_by', cancelled_by_param,
      'cancelled_at', cancellation_date_param
    )
  );
END;
$function$;

-- 9. Actualizar trigger update_property_cashflow para usar contract_id
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
  
  -- Solo sumar pagos vinculados a schedule items
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
  WHERE contract_id = NEW.contract_id
    AND TO_CHAR(expense_date, 'YYYY-MM') = period_text;
  
  -- CAMBIO CLAVE: Usar contract_id en lugar de solo property_id
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

-- 10. Actualizar función distribute_payment_to_owners para incluir contract_id
CREATE OR REPLACE FUNCTION public.distribute_payment_to_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
      -- NUEVO: Incluir contract_id en la distribución
      INSERT INTO pms_payment_distributions (
        payment_id, owner_id, tenant_id, contract_id,
        amount, share_percent, currency
      ) VALUES (
        NEW.id, owner_record.owner_id, owner_record.tenant_id, NEW.contract_id,
        total_amount * (owner_record.share_percent / 100),
        owner_record.share_percent, NEW.currency
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 11. Actualizar función recalculate_all_cashflow para trabajar por contrato
CREATE OR REPLACE FUNCTION public.recalculate_all_cashflow()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  contract_rec RECORD;
  period_rec RECORD;
  total_income_calc NUMERIC;
  total_expenses_calc NUMERIC;
BEGIN
  -- Limpiar cashflow existente
  DELETE FROM pms_cashflow_property WHERE true;
  
  -- Para cada contrato (agrupado por contrato, no por propiedad)
  FOR contract_rec IN
    SELECT DISTINCT 
      c.id as contract_id,
      c.tenant_id,
      c.property_id,
      c.currency,
      c.start_date,
      c.end_date
    FROM pms_contracts c
    WHERE c.status IN ('active', 'expired', 'cancelled')
  LOOP
    -- Para cada período con pagos dentro del rango del contrato
    FOR period_rec IN
      SELECT DISTINCT 
        TO_CHAR(COALESCE(p.paid_date, p.due_date), 'YYYY-MM') as period
      FROM pms_payments p
      WHERE p.contract_id = contract_rec.contract_id
        AND p.status = 'paid'
        AND COALESCE(p.paid_date, p.due_date) >= contract_rec.start_date
        AND COALESCE(p.paid_date, p.due_date) <= contract_rec.end_date
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
      
      -- Calcular gastos del período para este contrato
      SELECT COALESCE(SUM(amount), 0)
      INTO total_expenses_calc
      FROM pms_expenses
      WHERE contract_id = contract_rec.contract_id
        AND TO_CHAR(expense_date, 'YYYY-MM') = period_rec.period;
      
      -- Insertar solo si hay ingresos o gastos
      IF total_income_calc > 0 OR total_expenses_calc > 0 THEN
        INSERT INTO pms_cashflow_property (
          property_id, contract_id, tenant_id, period, currency,
          total_income, total_expenses, net_result
        ) VALUES (
          contract_rec.property_id,
          contract_rec.contract_id,
          contract_rec.tenant_id,
          period_rec.period,
          contract_rec.currency,
          total_income_calc,
          total_expenses_calc,
          total_income_calc - total_expenses_calc
        )
        ON CONFLICT (contract_id, period, currency) DO UPDATE
        SET total_income = EXCLUDED.total_income,
            total_expenses = EXCLUDED.total_expenses,
            net_result = EXCLUDED.total_income - EXCLUDED.total_expenses,
            updated_at = NOW();
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Cashflow recalculado exitosamente por contrato';
END;
$function$;