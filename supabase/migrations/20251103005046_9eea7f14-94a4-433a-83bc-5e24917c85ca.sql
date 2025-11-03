-- Corregir rpc_apply_contract_adjustment para regenerar proyecciones y schedule items
-- Esto asegura que después de cada ajuste, los valores se actualicen automáticamente

CREATE OR REPLACE FUNCTION rpc_apply_contract_adjustment(
  p_contract_id uuid, 
  p_asof date DEFAULT CURRENT_DATE
)
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
DECLARE
  c record;
  cur record;
  rec record;
  step int;
  next_adj date;
  from_month date;
  to_month date;
  fact numeric;
  prev_amount numeric;
  new_amount numeric;
  a_prev numeric;
  a_new numeric;
  b_prev numeric;
  b_new numeric;
BEGIN
  -- Validar acceso por tenant
  IF NOT EXISTS (
    SELECT 1 FROM pms_contracts 
    WHERE id = p_contract_id 
    AND tenant_id IN (
      SELECT tenant_id FROM user_roles 
      WHERE user_id = auth.uid() AND module = 'PMS'::module_type
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to contract';
  END IF;

  -- Obtener contrato
  SELECT * INTO c FROM pms_contracts WHERE id = p_contract_id;
  
  IF c.indice_ajuste = 'Sin ajuste' OR c.indice_ajuste IS NULL THEN
    RETURN jsonb_build_object('error', 'No adjustment configured');
  END IF;

  step := pms_months_in_frequency(c.frecuencia_ajuste);
  
  -- Calcular próxima fecha de ajuste
  IF c.fecha_primer_ajuste IS NOT NULL THEN
    next_adj := pms_next_adjustment_date(c.fecha_primer_ajuste, c.frecuencia_ajuste, p_asof);
  ELSE
    next_adj := pms_next_adjustment_date(c.start_date, c.frecuencia_ajuste, p_asof);
  END IF;

  -- Verificar que llegó la fecha
  IF next_adj > p_asof THEN
    RETURN jsonb_build_object(
      'message', 'Adjustment not due yet',
      'next_adjustment_date', next_adj
    );
  END IF;

  -- Ventana de meses
  to_month := date_trunc('month', (next_adj - interval '1 day')::date)::date;
  from_month := date_trunc('month', (to_month - ((step - 1) || ' months')::interval))::date;

  -- Calcular factor
  fact := pms_index_factor(c.indice_ajuste, from_month, to_month);

  -- Obtener monto previo
  SELECT * INTO cur FROM pms_contract_current WHERE contract_id = c.id FOR UPDATE;
  
  IF NOT FOUND THEN
    a_prev := COALESCE(c.monto_a, 0);
    b_prev := COALESCE(c.monto_b, 0);
    prev_amount := COALESCE(a_prev + b_prev, c.monthly_rent);
  ELSE
    prev_amount := cur.current_amount;
    a_prev := cur.current_item_a;
    b_prev := cur.current_item_b;
  END IF;

  -- Aplicar factor
  new_amount := prev_amount * fact;
  
  IF c.monto_a IS NOT NULL OR c.monto_b IS NOT NULL THEN
    a_new := COALESCE(a_prev, 0) * fact;
    b_new := COALESCE(b_prev, 0) * fact;
  END IF;

  -- Redondeo
  IF c.rounding_mode = 'UP' THEN
    new_amount := ceil(new_amount);
    a_new := CASE WHEN a_new IS NOT NULL THEN ceil(a_new) ELSE NULL END;
    b_new := CASE WHEN b_new IS NOT NULL THEN ceil(b_new) ELSE NULL END;
  ELSIF c.rounding_mode = 'DOWN' THEN
    new_amount := floor(new_amount);
    a_new := CASE WHEN a_new IS NOT NULL THEN floor(a_new) ELSE NULL END;
    b_new := CASE WHEN b_new IS NOT NULL THEN floor(b_new) ELSE NULL END;
  ELSE
    new_amount := round(new_amount);
    a_new := CASE WHEN a_new IS NOT NULL THEN round(a_new) ELSE NULL END;
    b_new := CASE WHEN b_new IS NOT NULL THEN round(b_new) ELSE NULL END;
  END IF;

  -- Registrar ajuste
  INSERT INTO pms_contract_adjustments (
    contract_id, tenant_id, period_from, period_to, factor, pct_cumulative,
    prev_amount, new_amount, 
    item_a_prev_amount, item_a_new_amount,
    item_b_prev_amount, item_b_new_amount,
    applied_at
  )
  VALUES (
    c.id, c.tenant_id, from_month, to_month, fact, (fact - 1) * 100,
    prev_amount, new_amount,
    a_prev, a_new,
    b_prev, b_new,
    next_adj
  )
  ON CONFLICT (contract_id, applied_at) DO NOTHING
  RETURNING * INTO rec;

  IF rec.id IS NULL THEN
    RETURN jsonb_build_object('message', 'Adjustment already applied for this date');
  END IF;

  -- Actualizar current
  INSERT INTO pms_contract_current (
    contract_id, tenant_id, current_amount, current_item_a, current_item_b,
    current_from, last_adjustment_date, next_adjustment_date
  )
  VALUES (
    c.id, c.tenant_id, new_amount, a_new, b_new,
    next_adj, next_adj,
    pms_next_adjustment_date(
      COALESCE(c.fecha_primer_ajuste, c.start_date), 
      c.frecuencia_ajuste, 
      next_adj
    )
  )
  ON CONFLICT (contract_id) DO UPDATE SET
    current_amount = EXCLUDED.current_amount,
    current_item_a = EXCLUDED.current_item_a,
    current_item_b = EXCLUDED.current_item_b,
    current_from = EXCLUDED.current_from,
    last_adjustment_date = EXCLUDED.last_adjustment_date,
    next_adjustment_date = EXCLUDED.next_adjustment_date,
    updated_at = now();

  -- Persistir nuevos montos base
  IF a_new IS NOT NULL OR b_new IS NOT NULL THEN
    UPDATE pms_contracts
    SET monto_a = COALESCE(a_new, monto_a),
        monto_b = COALESCE(b_new, monto_b),
        updated_at = now()
    WHERE id = c.id;
  ELSE
    UPDATE pms_contracts
    SET monthly_rent = new_amount,
        updated_at = now()
    WHERE id = c.id;
  END IF;

  -- ✅ CORRECCIÓN CRÍTICA: Regenerar proyecciones mensuales desde la fecha de ajuste
  -- Esto actualiza pms_contract_monthly_projections con los nuevos valores ajustados
  PERFORM generate_contract_monthly_projections(c.id, next_adj);

  -- ✅ CORRECCIÓN CRÍTICA: Regenerar schedule items preservando pagos acumulados
  -- Esto actualiza pms_payment_schedule_items con los nuevos expected_amount
  -- manteniendo accumulated_paid_amount y recalculando status dinámicamente
  PERFORM generate_payment_schedule_items(c.id);

  RETURN jsonb_build_object(
    'success', true,
    'adjustment_id', rec.id,
    'prev_amount', prev_amount,
    'new_amount', new_amount,
    'factor', fact,
    'pct_cumulative', (fact - 1) * 100,
    'applied_at', next_adj,
    'next_adjustment_date', pms_next_adjustment_date(
      COALESCE(c.fecha_primer_ajuste, c.start_date),
      c.frecuencia_ajuste,
      next_adj
    )
  );
END;
$$;