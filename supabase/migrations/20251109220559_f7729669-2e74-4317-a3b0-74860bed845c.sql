-- Agregar campos a pms_access_requests para soportar solicitudes de suscripción
ALTER TABLE pms_access_requests
ADD COLUMN desired_plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
ADD COLUMN payment_method TEXT,
ADD COLUMN payment_proof_url TEXT,
ADD COLUMN approved_subscription_id UUID REFERENCES tenant_subscriptions(id);

-- Crear índice para búsquedas eficientes
CREATE INDEX idx_pms_access_requests_desired_plan ON pms_access_requests(desired_plan_id);
CREATE INDEX idx_pms_access_requests_approved_subscription ON pms_access_requests(approved_subscription_id);

-- Función RPC para aprobar solicitud de suscripción y crear tenant + subscription
CREATE OR REPLACE FUNCTION approve_subscription_request(
  p_request_id UUID,
  p_trial_days INTEGER DEFAULT 14
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_request RECORD;
  v_plan RECORD;
  v_tenant_id UUID;
  v_subscription_id UUID;
  v_user_email TEXT;
BEGIN
  -- Verificar que el usuario actual es superadmin
  IF NOT has_pms_role(auth.uid(), 'SUPERADMIN') THEN
    RAISE EXCEPTION 'Solo SUPERADMIN puede aprobar suscripciones';
  END IF;

  -- Obtener solicitud
  SELECT * INTO v_request
  FROM pms_access_requests
  WHERE id = p_request_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada o ya procesada';
  END IF;

  -- Obtener plan deseado
  IF v_request.desired_plan_id IS NOT NULL THEN
    SELECT * INTO v_plan
    FROM subscription_plans
    WHERE id = v_request.desired_plan_id
      AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Plan no encontrado o inactivo';
    END IF;
  ELSE
    RAISE EXCEPTION 'La solicitud no tiene un plan asociado';
  END IF;

  -- Obtener email del usuario
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_request.user_id;

  -- Crear tenant si no existe
  IF v_request.tenant_id IS NULL THEN
    INSERT INTO pms_tenants (
      name,
      slug,
      tenant_type,
      is_active
    ) VALUES (
      COALESCE(v_request.company_name, v_user_email),
      LOWER(REGEXP_REPLACE(COALESCE(v_request.company_name, v_user_email), '[^a-zA-Z0-9]+', '-', 'g')),
      'inmobiliaria',
      true
    )
    RETURNING id INTO v_tenant_id;
  ELSE
    v_tenant_id := v_request.tenant_id;
  END IF;

  -- Crear suscripción con período de prueba
  INSERT INTO tenant_subscriptions (
    tenant_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    trial_end,
    cancel_at_period_end
  ) VALUES (
    v_tenant_id,
    v_plan.id,
    'trial',
    COALESCE(v_request.billing_cycle, 'monthly'),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month',
    CURRENT_DATE + (p_trial_days || ' days')::INTERVAL,
    false
  )
  RETURNING id INTO v_subscription_id;

  -- Crear factura pendiente (para tracking de pago manual)
  INSERT INTO subscription_invoices (
    subscription_id,
    tenant_id,
    amount,
    currency,
    status,
    due_date,
    billing_period_start,
    billing_period_end
  ) VALUES (
    v_subscription_id,
    v_tenant_id,
    CASE WHEN v_request.billing_cycle = 'yearly' THEN v_plan.yearly_price ELSE v_plan.monthly_price END,
    v_plan.currency,
    'pending',
    CURRENT_DATE + (p_trial_days || ' days')::INTERVAL,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month'
  );

  -- Asignar rol INMOBILIARIA al usuario
  INSERT INTO user_roles (
    user_id,
    tenant_id,
    module,
    role,
    status,
    approved_at
  ) VALUES (
    v_request.user_id,
    v_tenant_id,
    'PMS',
    'INMOBILIARIA',
    'approved',
    NOW()
  )
  ON CONFLICT (user_id, tenant_id, module, role) 
  DO UPDATE SET
    status = 'approved',
    approved_at = NOW();

  -- Actualizar solicitud
  UPDATE pms_access_requests
  SET status = 'approved',
      approved_at = NOW(),
      tenant_id = v_tenant_id,
      approved_subscription_id = v_subscription_id
  WHERE id = p_request_id;

  -- Retornar datos
  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'subscription_id', v_subscription_id,
    'trial_end', CURRENT_DATE + (p_trial_days || ' days')::INTERVAL,
    'plan_name', v_plan.name
  );
END;
$$;