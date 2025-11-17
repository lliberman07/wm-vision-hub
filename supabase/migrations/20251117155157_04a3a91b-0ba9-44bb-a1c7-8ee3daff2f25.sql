-- =====================================================
-- FASE 1: Sistema de Solicitudes de Suscripción
-- Actualización de tablas existentes y creación de nuevas
-- =====================================================

-- 1. Crear tabla subscription_requests (nueva)
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_type TEXT NOT NULL,
  company_name TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cuit_cuil TEXT,
  country TEXT NOT NULL DEFAULT 'Argentina',
  province TEXT,
  city TEXT,
  requested_plan_id UUID NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  estimated_properties INTEGER,
  current_system TEXT,
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  rejection_reason TEXT,
  created_tenant_id UUID,
  created_subscription_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT subscription_requests_applicant_type_check CHECK (applicant_type IN ('inmobiliaria', 'administrador_independiente', 'propietario')),
  CONSTRAINT subscription_requests_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'annual')),
  CONSTRAINT subscription_requests_status_check CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'cancelled'))
);

-- 2. Agregar columnas a subscription_invoices existente (para Fase 2 de pagos automáticos)
ALTER TABLE public.subscription_invoices 
  ADD COLUMN IF NOT EXISTS billing_period_start DATE,
  ADD COLUMN IF NOT EXISTS billing_period_end DATE,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
  ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS auto_payment_attempted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_payment_failed_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Agregar constraint para payment_gateway
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_invoices_payment_gateway_check'
  ) THEN
    ALTER TABLE public.subscription_invoices 
      ADD CONSTRAINT subscription_invoices_payment_gateway_check 
      CHECK (payment_gateway IN ('mercadopago', 'stripe'));
  END IF;
END $$;

-- 3. Crear tabla payment_receipts (nueva)
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  receipt_url TEXT NOT NULL,
  receipt_type TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT payment_receipts_receipt_type_check CHECK (receipt_type IN ('bank_transfer', 'cash_receipt', 'check', 'other')),
  CONSTRAINT payment_receipts_verification_status_check CHECK (verification_status IN ('pending', 'verified', 'rejected'))
);

-- 4. Crear índices
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON public.subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_email ON public.subscription_requests(email);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_created_at ON public.subscription_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_invoice ON public.payment_receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_verification_status ON public.payment_receipts(verification_status);

-- 5. Crear/actualizar triggers
DROP TRIGGER IF EXISTS update_subscription_requests_updated_at ON public.subscription_requests;
CREATE TRIGGER update_subscription_requests_updated_at
  BEFORE UPDATE ON public.subscription_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_receipts_updated_at ON public.payment_receipts;
CREATE TRIGGER update_payment_receipts_updated_at
  BEFORE UPDATE ON public.payment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS Policies para subscription_requests
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create subscription requests" ON public.subscription_requests;
CREATE POLICY "Anyone can create subscription requests"
  ON public.subscription_requests FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Granada admins can view all requests" ON public.subscription_requests;
CREATE POLICY "Granada admins can view all requests"
  ON public.subscription_requests FOR SELECT
  TO authenticated
  USING (is_granada_admin(auth.uid()));

DROP POLICY IF EXISTS "Granada admins can update requests" ON public.subscription_requests;
CREATE POLICY "Granada admins can update requests"
  ON public.subscription_requests FOR UPDATE
  TO authenticated
  USING (is_granada_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view their own requests" ON public.subscription_requests;
CREATE POLICY "Users can view their own requests"
  ON public.subscription_requests FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 7. RLS Policies para payment_receipts
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Granada admins can manage all receipts" ON public.payment_receipts;
CREATE POLICY "Granada admins can manage all receipts"
  ON public.payment_receipts FOR ALL
  TO authenticated
  USING (is_granada_admin(auth.uid()));

DROP POLICY IF EXISTS "Tenant admins can upload receipts" ON public.payment_receipts;
CREATE POLICY "Tenant admins can upload receipts"
  ON public.payment_receipts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pms_client_users cu
      WHERE cu.tenant_id = payment_receipts.tenant_id
        AND cu.user_id = auth.uid()
        AND cu.user_type = 'CLIENT_ADMIN'
        AND cu.is_active = true
    )
  );

DROP POLICY IF EXISTS "Tenant admins can view their receipts" ON public.payment_receipts;
CREATE POLICY "Tenant admins can view their receipts"
  ON public.payment_receipts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pms_client_users cu
      WHERE cu.tenant_id = payment_receipts.tenant_id
        AND cu.user_id = auth.uid()
        AND cu.user_type = 'CLIENT_ADMIN'
        AND cu.is_active = true
    )
  );