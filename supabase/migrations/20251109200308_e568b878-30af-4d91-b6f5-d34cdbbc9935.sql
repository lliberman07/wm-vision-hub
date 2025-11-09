-- =====================================================
-- SISTEMA DE SUSCRIPCIONES PARA TENANTS PMS (CORREGIDO)
-- Opción 3: Híbrido mejorado (campos específicos + JSONB)
-- =====================================================

-- 1️⃣ Crear ENUM para estados de suscripción
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'suspended', 'cancelled');

-- 2️⃣ Crear ENUM para ciclos de facturación
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

-- 3️⃣ Crear ENUM para estados de facturas
CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'refunded');

-- 4️⃣ Tabla: subscription_plans (Planes de suscripción)
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Límites críticos (campos específicos)
  -- NULL = ilimitado, usamos 999999 para representar "virtualmente ilimitado"
  max_users INTEGER NOT NULL DEFAULT 2,
  max_properties INTEGER, -- NULL = ilimitado
  max_contracts INTEGER, -- NULL = ilimitado
  max_branches INTEGER NOT NULL DEFAULT 0, -- 0 = sin sucursales
  
  -- Límites adicionales (JSONB flexible)
  additional_limits JSONB DEFAULT '{
    "max_admin_users": null,
    "max_storage_gb": 5,
    "max_monthly_reports": null,
    "max_api_calls_per_day": null
  }'::jsonb,
  
  -- Features (JSONB booleanos)
  features JSONB DEFAULT '{
    "advanced_reports": false,
    "api_access": false,
    "custom_branding": false,
    "priority_support": false,
    "whitelabel": false,
    "bulk_operations": false,
    "advanced_analytics": false,
    "custom_notifications": false
  }'::jsonb,
  
  -- Precios
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Estado y orden
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5️⃣ Tabla: tenant_subscriptions (Suscripciones activas de tenants)
CREATE TABLE public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pms_tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  
  status subscription_status NOT NULL DEFAULT 'trial',
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  trial_end_date DATE,
  
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- 6️⃣ Tabla: subscription_invoices (Facturas generadas)
CREATE TABLE public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.tenant_subscriptions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.pms_tenants(id) ON DELETE CASCADE,
  
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  
  status invoice_status NOT NULL DEFAULT 'pending',
  
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7️⃣ Tabla: subscription_usage_logs (Registro histórico de uso)
CREATE TABLE public.subscription_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pms_tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.tenant_subscriptions(id) ON DELETE SET NULL,
  
  log_date DATE NOT NULL,
  user_count INTEGER NOT NULL DEFAULT 0,
  property_count INTEGER NOT NULL DEFAULT 0,
  contract_count INTEGER NOT NULL DEFAULT 0,
  branch_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, log_date)
);

-- 8️⃣ Modificar tabla pms_tenants: agregar current_subscription_id
ALTER TABLE public.pms_tenants
ADD COLUMN current_subscription_id UUID REFERENCES public.tenant_subscriptions(id) ON DELETE SET NULL;

-- 9️⃣ Crear índices para performance
CREATE INDEX idx_tenant_subscriptions_tenant_id ON public.tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_subscriptions_plan_id ON public.tenant_subscriptions(plan_id);
CREATE INDEX idx_tenant_subscriptions_status ON public.tenant_subscriptions(status);
CREATE INDEX idx_subscription_invoices_tenant_id ON public.subscription_invoices(tenant_id);
CREATE INDEX idx_subscription_invoices_subscription_id ON public.subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_status ON public.subscription_invoices(status);
CREATE INDEX idx_subscription_usage_logs_tenant_date ON public.subscription_usage_logs(tenant_id, log_date DESC);

-- 🔟 Función: check_tenant_limits - Validar si el tenant puede crear un recurso
CREATE OR REPLACE FUNCTION public.check_tenant_limits(
  p_tenant_id UUID,
  p_resource_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_plan RECORD;
  v_current_count INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT * INTO v_subscription
  FROM tenant_subscriptions
  WHERE tenant_id = p_tenant_id
    AND status IN ('trial', 'active')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'No hay suscripción activa',
      'current_count', 0,
      'limit', 0
    );
  END IF;

  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_subscription.plan_id;

  CASE p_resource_type
    WHEN 'user' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM user_roles
      WHERE tenant_id = p_tenant_id
        AND module = 'PMS'
        AND status = 'approved'
        AND role::text IN ('INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO');
      v_limit := v_plan.max_users;

    WHEN 'property' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM pms_properties
      WHERE tenant_id = p_tenant_id;
      v_limit := v_plan.max_properties;

    WHEN 'contract' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM pms_contracts
      WHERE tenant_id = p_tenant_id
        AND status = 'active';
      v_limit := v_plan.max_contracts;

    WHEN 'branch' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM pms_tenants
      WHERE parent_tenant_id = p_tenant_id;
      v_limit := v_plan.max_branches;

    ELSE
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Tipo de recurso no reconocido',
        'current_count', 0,
        'limit', 0
      );
  END CASE;

  IF v_limit IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'Ilimitado',
      'current_count', v_current_count,
      'limit', NULL
    );
  END IF;

  IF v_current_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Límite alcanzado',
      'current_count', v_current_count,
      'limit', v_limit
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'OK',
    'current_count', v_current_count,
    'limit', v_limit
  );
END;
$$;

-- 1️⃣1️⃣ Función: get_tenant_subscription_status
CREATE OR REPLACE FUNCTION public.get_tenant_subscription_status(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_plan RECORD;
  v_usage RECORD;
  v_pending_invoice RECORD;
BEGIN
  SELECT * INTO v_subscription
  FROM tenant_subscriptions
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_subscription', false,
      'message', 'Sin suscripción'
    );
  END IF;

  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_subscription.plan_id;

  SELECT 
    COUNT(DISTINCT CASE WHEN ur.role::text IN ('INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO') THEN ur.user_id END) as user_count,
    COUNT(DISTINCT p.id) as property_count,
    COUNT(DISTINCT c.id) as contract_count,
    COUNT(DISTINCT sub.id) as branch_count
  INTO v_usage
  FROM pms_tenants t
  LEFT JOIN user_roles ur ON ur.tenant_id = t.id AND ur.module = 'PMS' AND ur.status = 'approved'
  LEFT JOIN pms_properties p ON p.tenant_id = t.id
  LEFT JOIN pms_contracts c ON c.tenant_id = t.id AND c.status = 'active'
  LEFT JOIN pms_tenants sub ON sub.parent_tenant_id = t.id
  WHERE t.id = p_tenant_id;

  SELECT * INTO v_pending_invoice
  FROM subscription_invoices
  WHERE tenant_id = p_tenant_id
    AND status IN ('pending', 'overdue')
  ORDER BY due_date ASC
  LIMIT 1;

  RETURN jsonb_build_object(
    'has_subscription', true,
    'subscription', jsonb_build_object(
      'id', v_subscription.id,
      'status', v_subscription.status,
      'billing_cycle', v_subscription.billing_cycle,
      'current_period_start', v_subscription.current_period_start,
      'current_period_end', v_subscription.current_period_end,
      'days_remaining', v_subscription.current_period_end - CURRENT_DATE,
      'cancel_at_period_end', v_subscription.cancel_at_period_end
    ),
    'plan', jsonb_build_object(
      'id', v_plan.id,
      'name', v_plan.name,
      'max_users', v_plan.max_users,
      'max_properties', v_plan.max_properties,
      'max_contracts', v_plan.max_contracts,
      'max_branches', v_plan.max_branches,
      'features', v_plan.features,
      'additional_limits', v_plan.additional_limits
    ),
    'usage', jsonb_build_object(
      'user_count', v_usage.user_count,
      'property_count', v_usage.property_count,
      'contract_count', v_usage.contract_count,
      'branch_count', v_usage.branch_count
    ),
    'pending_invoice', CASE 
      WHEN v_pending_invoice.id IS NOT NULL THEN
        jsonb_build_object(
          'id', v_pending_invoice.id,
          'amount', v_pending_invoice.amount,
          'due_date', v_pending_invoice.due_date,
          'status', v_pending_invoice.status,
          'days_overdue', CASE 
            WHEN v_pending_invoice.due_date < CURRENT_DATE THEN CURRENT_DATE - v_pending_invoice.due_date
            ELSE 0
          END
        )
      ELSE NULL
    END
  );
END;
$$;

-- 1️⃣2️⃣ Función: update_subscription_status
CREATE OR REPLACE FUNCTION public.update_subscription_status()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_overdue_invoice RECORD;
  v_days_overdue INTEGER;
BEGIN
  FOR v_subscription IN
    SELECT * FROM tenant_subscriptions
    WHERE status IN ('active', 'past_due', 'trial')
  LOOP
    IF v_subscription.status = 'trial' 
       AND v_subscription.trial_end_date IS NOT NULL 
       AND v_subscription.trial_end_date < CURRENT_DATE THEN
      
      UPDATE tenant_subscriptions
      SET status = 'active',
          updated_at = NOW()
      WHERE id = v_subscription.id;
      CONTINUE;
    END IF;

    SELECT * INTO v_overdue_invoice
    FROM subscription_invoices
    WHERE subscription_id = v_subscription.id
      AND status IN ('pending', 'overdue')
      AND due_date < CURRENT_DATE
    ORDER BY due_date ASC
    LIMIT 1;

    IF FOUND THEN
      IF v_overdue_invoice.status = 'pending' THEN
        UPDATE subscription_invoices
        SET status = 'overdue',
            updated_at = NOW()
        WHERE id = v_overdue_invoice.id;
      END IF;

      v_days_overdue := CURRENT_DATE - v_overdue_invoice.due_date;

      IF v_days_overdue >= 15 AND v_subscription.status != 'suspended' THEN
        UPDATE tenant_subscriptions
        SET status = 'suspended',
            updated_at = NOW()
        WHERE id = v_subscription.id;
        
      ELSIF v_days_overdue > 0 AND v_days_overdue < 15 AND v_subscription.status = 'active' THEN
        UPDATE tenant_subscriptions
        SET status = 'past_due',
            updated_at = NOW()
        WHERE id = v_subscription.id;
      END IF;
    ELSE
      IF v_subscription.status = 'past_due' THEN
        UPDATE tenant_subscriptions
        SET status = 'active',
            updated_at = NOW()
        WHERE id = v_subscription.id;
      END IF;
    END IF;

    IF v_subscription.cancel_at_period_end 
       AND v_subscription.current_period_end < CURRENT_DATE 
       AND v_subscription.status != 'cancelled' THEN
      
      UPDATE tenant_subscriptions
      SET status = 'cancelled',
          cancelled_at = NOW(),
          updated_at = NOW()
      WHERE id = v_subscription.id;
    END IF;
  END LOOP;
END;
$$;

-- 1️⃣3️⃣ Función: log_daily_usage
CREATE OR REPLACE FUNCTION public.log_daily_usage()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant RECORD;
  v_usage RECORD;
BEGIN
  FOR v_tenant IN
    SELECT id, current_subscription_id
    FROM pms_tenants
    WHERE is_active = true
  LOOP
    SELECT 
      COUNT(DISTINCT CASE WHEN ur.role::text IN ('INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO', 'INQUILINO') THEN ur.user_id END) as user_count,
      COUNT(DISTINCT p.id) as property_count,
      COUNT(DISTINCT c.id) as contract_count,
      COUNT(DISTINCT sub.id) as branch_count
    INTO v_usage
    FROM pms_tenants t
    LEFT JOIN user_roles ur ON ur.tenant_id = t.id AND ur.module = 'PMS' AND ur.status = 'approved'
    LEFT JOIN pms_properties p ON p.tenant_id = t.id
    LEFT JOIN pms_contracts c ON c.tenant_id = t.id AND c.status = 'active'
    LEFT JOIN pms_tenants sub ON sub.parent_tenant_id = t.id
    WHERE t.id = v_tenant.id;

    INSERT INTO subscription_usage_logs (
      tenant_id,
      subscription_id,
      log_date,
      user_count,
      property_count,
      contract_count,
      branch_count
    )
    VALUES (
      v_tenant.id,
      v_tenant.current_subscription_id,
      CURRENT_DATE,
      v_usage.user_count,
      v_usage.property_count,
      v_usage.contract_count,
      v_usage.branch_count
    )
    ON CONFLICT (tenant_id, log_date) DO UPDATE
    SET user_count = EXCLUDED.user_count,
        property_count = EXCLUDED.property_count,
        contract_count = EXCLUDED.contract_count,
        branch_count = EXCLUDED.branch_count;
  END LOOP;
END;
$$;

-- 1️⃣4️⃣ Trigger: Actualizar updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_subscription_plans_updated_at
BEFORE UPDATE ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER trigger_tenant_subscriptions_updated_at
BEFORE UPDATE ON tenant_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER trigger_subscription_invoices_updated_at
BEFORE UPDATE ON subscription_invoices
FOR EACH ROW
EXECUTE FUNCTION update_subscription_updated_at();

-- 1️⃣5️⃣ RLS POLICIES
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

CREATE POLICY "Superadmin can manage plans"
ON public.subscription_plans
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::user_role_type));

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant subscription"
ON public.tenant_subscriptions
FOR SELECT
USING (
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id)
  OR has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
  OR has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role)
);

CREATE POLICY "Admins can manage all subscriptions"
ON public.tenant_subscriptions
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant invoices"
ON public.subscription_invoices
FOR SELECT
USING (
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id)
  OR has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
  OR has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role)
);

CREATE POLICY "Admins can manage all invoices"
ON public.subscription_invoices
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

ALTER TABLE public.subscription_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant usage logs"
ON public.subscription_usage_logs
FOR SELECT
USING (
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id)
  OR has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
  OR has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role)
);

CREATE POLICY "Admins can manage all usage logs"
ON public.subscription_usage_logs
FOR ALL
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- 1️⃣6️⃣ DATOS INICIALES
INSERT INTO public.subscription_plans (
  name, slug, description,
  max_users, max_properties, max_contracts, max_branches,
  additional_limits, features,
  price_monthly, price_yearly,
  is_active, sort_order
) VALUES 
(
  'Básico',
  'basic',
  'Plan ideal para pequeños propietarios o administradores individuales',
  2, 10, 10, 0,
  '{"max_admin_users": 1, "max_storage_gb": 5, "max_monthly_reports": 10, "max_api_calls_per_day": null}'::jsonb,
  '{"advanced_reports": false, "api_access": false, "custom_branding": false, "priority_support": false, "whitelabel": false, "bulk_operations": false, "advanced_analytics": false, "custom_notifications": false}'::jsonb,
  15000.00, 150000.00, true, 1
),
(
  'Profesional',
  'professional',
  'Para inmobiliarias medianas con múltiples propiedades',
  10, 50, 50, 2,
  '{"max_admin_users": 5, "max_storage_gb": 25, "max_monthly_reports": 50, "max_api_calls_per_day": 1000}'::jsonb,
  '{"advanced_reports": true, "api_access": true, "custom_branding": true, "priority_support": false, "whitelabel": false, "bulk_operations": true, "advanced_analytics": true, "custom_notifications": true}'::jsonb,
  45000.00, 450000.00, true, 2
),
(
  'Enterprise',
  'enterprise',
  'Solución completa para grandes inmobiliarias y corporativos',
  999999, NULL, NULL, 10,
  '{"max_admin_users": null, "max_storage_gb": 100, "max_monthly_reports": null, "max_api_calls_per_day": null}'::jsonb,
  '{"advanced_reports": true, "api_access": true, "custom_branding": true, "priority_support": true, "whitelabel": true, "bulk_operations": true, "advanced_analytics": true, "custom_notifications": true}'::jsonb,
  120000.00, 1200000.00, true, 3
),
(
  'Legacy',
  'legacy',
  'Plan para tenants existentes (migración)',
  20, NULL, NULL, 5,
  '{"max_admin_users": null, "max_storage_gb": 50, "max_monthly_reports": null, "max_api_calls_per_day": null}'::jsonb,
  '{"advanced_reports": true, "api_access": true, "custom_branding": true, "priority_support": true, "whitelabel": false, "bulk_operations": true, "advanced_analytics": true, "custom_notifications": true}'::jsonb,
  0.00, 0.00, false, 999
);

-- 1️⃣7️⃣ MIGRACIÓN DE DATOS
DO $$
DECLARE
  v_legacy_plan_id UUID;
  v_tenant RECORD;
  v_subscription_id UUID;
BEGIN
  SELECT id INTO v_legacy_plan_id FROM subscription_plans WHERE slug = 'legacy';

  FOR v_tenant IN SELECT id FROM pms_tenants WHERE current_subscription_id IS NULL
  LOOP
    INSERT INTO tenant_subscriptions (
      tenant_id, plan_id, status, billing_cycle,
      current_period_start, current_period_end
    ) VALUES (
      v_tenant.id, v_legacy_plan_id, 'active', 'monthly',
      CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year'
    )
    ON CONFLICT (tenant_id) DO NOTHING
    RETURNING id INTO v_subscription_id;

    IF v_subscription_id IS NOT NULL THEN
      UPDATE pms_tenants
      SET current_subscription_id = v_subscription_id
      WHERE id = v_tenant.id;
    END IF;
  END LOOP;
END $$;