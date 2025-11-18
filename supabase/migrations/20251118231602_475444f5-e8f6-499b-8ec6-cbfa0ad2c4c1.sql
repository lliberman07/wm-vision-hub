-- FASE 1: Trial Único por Cliente
-- Agregar campos de tracking de trial a pms_tenants
ALTER TABLE pms_tenants 
ADD COLUMN IF NOT EXISTS has_used_trial boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_used_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS trial_email text;

CREATE INDEX IF NOT EXISTS idx_pms_tenants_trial_email ON pms_tenants(trial_email) WHERE trial_email IS NOT NULL;

-- FASE 1: Función para verificar elegibilidad de trial
CREATE OR REPLACE FUNCTION check_trial_eligibility(
  p_email text,
  p_cuit_cuil text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_trial_used_by_email boolean;
  v_trial_used_by_cuit boolean;
  v_tenant_name text;
  v_trial_date timestamp;
BEGIN
  -- Verificar por email
  SELECT 
    has_used_trial, 
    name, 
    trial_used_at 
  INTO v_trial_used_by_email, v_tenant_name, v_trial_date
  FROM pms_tenants
  WHERE trial_email = LOWER(TRIM(p_email))
    AND has_used_trial = true
  LIMIT 1;
  
  -- Si hay CUIT/CUIL, verificar también
  IF p_cuit_cuil IS NOT NULL THEN
    SELECT 
      has_used_trial,
      name,
      trial_used_at
    INTO v_trial_used_by_cuit, v_tenant_name, v_trial_date
    FROM pms_tenants
    WHERE cuit_cuil = TRIM(p_cuit_cuil)
      AND has_used_trial = true
    LIMIT 1;
  END IF;
  
  -- Si ya usó trial
  IF v_trial_used_by_email OR v_trial_used_by_cuit THEN
    RETURN jsonb_build_object(
      'is_eligible', false,
      'reason', CASE 
        WHEN v_trial_used_by_email THEN 'email_already_used'
        ELSE 'cuit_already_used'
      END,
      'previous_tenant', v_tenant_name,
      'trial_used_at', v_trial_date,
      'message', format('Este %s ya utilizó el período de prueba en %s el %s',
        CASE WHEN v_trial_used_by_email THEN 'email' ELSE 'CUIT/CUIL' END,
        v_tenant_name,
        TO_CHAR(v_trial_date, 'DD/MM/YYYY')
      )
    );
  END IF;
  
  -- Es elegible
  RETURN jsonb_build_object(
    'is_eligible', true,
    'message', 'Elegible para período de prueba de 30 días'
  );
END;
$$;

-- FASE 3: Función para generar próximas facturas de renovación
CREATE OR REPLACE FUNCTION generate_renewal_invoices()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subscription RECORD;
  v_plan RECORD;
  v_invoice_number text;
  v_new_period_start date;
  v_new_period_end date;
  v_created_count integer := 0;
  v_skipped_count integer := 0;
BEGIN
  -- Buscar suscripciones que renuevan en 7 días
  FOR v_subscription IN 
    SELECT ts.*, sp.name as plan_name, sp.price_monthly, sp.price_yearly, sp.currency
    FROM tenant_subscriptions ts
    JOIN subscription_plans sp ON sp.id = ts.plan_id
    WHERE ts.current_period_end = CURRENT_DATE + 7
      AND ts.status IN ('trial', 'active')
      AND ts.cancel_at_period_end = false
      -- Solo si no existe ya factura para ese período
      AND NOT EXISTS (
        SELECT 1 FROM subscription_invoices si
        WHERE si.subscription_id = ts.id
          AND si.billing_period_start = ts.current_period_end + 1
      )
  LOOP
    BEGIN
      -- Calcular nuevo período
      v_new_period_start := v_subscription.current_period_end + 1;
      
      IF v_subscription.billing_cycle = 'monthly' THEN
        v_new_period_end := v_new_period_start + 29; -- 30 días totales
      ELSE
        v_new_period_end := v_new_period_start + 364; -- 365 días totales
      END IF;
      
      -- Generar número de factura
      v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
        UPPER(SUBSTRING(MD5(v_subscription.id::text || NOW()::text), 1, 8));
      
      -- Crear factura
      INSERT INTO subscription_invoices (
        subscription_id,
        tenant_id,
        invoice_number,
        invoice_type,
        amount,
        currency,
        status,
        issue_date,
        due_date,
        billing_period_start,
        billing_period_end,
        notes
      ) VALUES (
        v_subscription.id,
        v_subscription.tenant_id,
        v_invoice_number,
        'subscription',
        CASE 
          WHEN v_subscription.billing_cycle = 'monthly' 
          THEN v_subscription.price_monthly 
          ELSE v_subscription.price_yearly 
        END,
        v_subscription.currency,
        'pending',
        v_new_period_start,
        v_new_period_start + 7, -- 7 días para pagar
        v_new_period_start,
        v_new_period_end,
        format('Renovación %s - Plan %s', 
          CASE WHEN v_subscription.billing_cycle = 'monthly' THEN 'Mensual' ELSE 'Anual' END,
          v_subscription.plan_name
        )
      );
      
      v_created_count := v_created_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_skipped_count := v_skipped_count + 1;
      RAISE WARNING 'Error creating invoice for subscription %: %', v_subscription.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'created', v_created_count,
    'skipped', v_skipped_count,
    'execution_date', CURRENT_DATE
  );
END;
$$;

-- FASE 2: Función para convertir trials expirados
CREATE OR REPLACE FUNCTION convert_expired_trials()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subscription RECORD;
  v_converted_to_active integer := 0;
  v_suspended integer := 0;
BEGIN
  -- Buscar trials que expiran HOY
  FOR v_subscription IN 
    SELECT ts.*, si.id as invoice_id, si.status as invoice_status
    FROM tenant_subscriptions ts
    LEFT JOIN subscription_invoices si ON si.subscription_id = ts.id 
      AND si.invoice_type = 'subscription'
      AND si.billing_period_start = ts.current_period_end + 1
    WHERE ts.status = 'trial'
      AND ts.trial_end = CURRENT_DATE
  LOOP
    -- Si pagó la primera factura → Activar
    IF v_subscription.invoice_status = 'paid' THEN
      UPDATE tenant_subscriptions
      SET status = 'active',
          current_period_start = current_period_end + 1,
          current_period_end = CASE 
            WHEN billing_cycle = 'monthly' THEN current_period_end + 30
            ELSE current_period_end + 365
          END,
          updated_at = NOW()
      WHERE id = v_subscription.id;
      
      v_converted_to_active := v_converted_to_active + 1;
      
    -- Si NO pagó → Suspender
    ELSE
      UPDATE tenant_subscriptions
      SET status = 'suspended',
          cancelled_reason = 'Trial expirado sin pago',
          updated_at = NOW()
      WHERE id = v_subscription.id;
      
      v_suspended := v_suspended + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'converted_to_active', v_converted_to_active,
    'suspended', v_suspended,
    'execution_date', CURRENT_DATE
  );
END;
$$;