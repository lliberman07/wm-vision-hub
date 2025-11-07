-- =============================================
-- PAYMENT RECEIPTS SYSTEM
-- Sistema completo de generación y envío de recibos PDF
-- =============================================

-- 1. Crear tabla pms_payment_receipts
CREATE TABLE IF NOT EXISTS pms_payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES pms_payments(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES pms_contracts(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pms_payment_receipts
CREATE INDEX idx_payment_receipts_payment_id ON pms_payment_receipts(payment_id);
CREATE INDEX idx_payment_receipts_receipt_number ON pms_payment_receipts(receipt_number);
CREATE INDEX idx_payment_receipts_tenant ON pms_payment_receipts(tenant_id);
CREATE INDEX idx_payment_receipts_contract ON pms_payment_receipts(contract_id);
CREATE INDEX idx_payment_receipts_status ON pms_payment_receipts(status);

-- 2. Crear tabla pms_receipt_email_logs
CREATE TABLE IF NOT EXISTS pms_receipt_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id) ON DELETE CASCADE,
  receipt_id UUID NOT NULL REFERENCES pms_payment_receipts(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('tenant', 'owner', 'staff')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pms_receipt_email_logs
CREATE INDEX idx_receipt_email_logs_receipt ON pms_receipt_email_logs(receipt_id);
CREATE INDEX idx_receipt_email_logs_tenant ON pms_receipt_email_logs(tenant_id);
CREATE INDEX idx_receipt_email_logs_status ON pms_receipt_email_logs(status);

-- 3. Función para generar números de recibo únicos
CREATE OR REPLACE FUNCTION generate_receipt_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_year TEXT;
  v_count INTEGER;
  v_receipt_number TEXT;
BEGIN
  -- Obtener slug del tenant
  SELECT slug INTO v_slug
  FROM pms_tenants
  WHERE id = p_tenant_id;
  
  IF v_slug IS NULL THEN
    v_slug := 'unknown';
  END IF;
  
  -- Año actual
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Contar recibos del año actual para este tenant
  SELECT COUNT(*) INTO v_count
  FROM pms_payment_receipts
  WHERE tenant_id = p_tenant_id
    AND EXTRACT(YEAR FROM receipt_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Incrementar contador
  v_count := v_count + 1;
  
  -- Generar número con formato: REC-{slug}-{YYYY}-{número con padding}
  v_receipt_number := 'REC-' || v_slug || '-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
  
  RETURN v_receipt_number;
END;
$$;

-- 4. Agregar campos de configuración a pms_tenants (si no existen)
DO $$
BEGIN
  -- Verificar si ya existe la columna notification_settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pms_tenants' 
    AND column_name = 'notification_settings'
  ) THEN
    ALTER TABLE pms_tenants ADD COLUMN notification_settings JSONB DEFAULT '{
      "enable_payment_receipts": true,
      "receipt_auto_send": true,
      "receipt_recipients": {"tenant": true, "owners": true, "staff": false},
      "receipt_cc_emails": []
    }';
  END IF;
END $$;

-- 5. Trigger para actualizar updated_at en pms_payment_receipts
CREATE OR REPLACE FUNCTION update_payment_receipt_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_payment_receipt_updated_at
  BEFORE UPDATE ON pms_payment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_receipt_updated_at();

-- 6. RLS Policies para pms_payment_receipts
ALTER TABLE pms_payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage all receipts"
  ON pms_payment_receipts
  FOR ALL
  USING (
    has_pms_role(auth.uid(), 'SUPERADMIN') OR
    has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
    has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
  );

CREATE POLICY "Owners can view receipts of their properties"
  ON pms_payment_receipts
  FOR SELECT
  USING (
    has_pms_role(auth.uid(), 'PROPIETARIO', tenant_id) AND
    (
      contract_id IN (
        SELECT c.id
        FROM pms_contracts c
        JOIN pms_owner_properties op ON op.property_id = c.property_id
        JOIN pms_owners o ON o.id = op.owner_id
        WHERE o.user_id = auth.uid()
          AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
      )
      OR
      tenant_id IN (
        SELECT ur.tenant_id
        FROM user_roles ur
        JOIN pms_tenants t ON t.id = ur.tenant_id
        WHERE ur.user_id = auth.uid()
          AND ur.module = 'PMS'
          AND ur.role::text = 'PROPIETARIO'
          AND ur.status = 'approved'
          AND t.tenant_type = 'propietario'
      )
    )
  );

CREATE POLICY "Tenants can view receipts of their contracts"
  ON pms_payment_receipts
  FOR SELECT
  USING (
    has_pms_role(auth.uid(), 'INQUILINO', tenant_id) AND
    contract_id IN (
      SELECT c.id
      FROM pms_contracts c
      JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
      WHERE tr.user_id = auth.uid()
        AND c.status = 'active'
    )
  );

-- 7. RLS Policies para pms_receipt_email_logs
ALTER TABLE pms_receipt_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all email logs"
  ON pms_receipt_email_logs
  FOR SELECT
  USING (
    has_pms_role(auth.uid(), 'SUPERADMIN') OR
    has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
    has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
  );

CREATE POLICY "Staff can insert email logs"
  ON pms_receipt_email_logs
  FOR INSERT
  WITH CHECK (
    has_pms_role(auth.uid(), 'SUPERADMIN') OR
    has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
    has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
  );

-- 8. Actualizar función approve_payment_submission para generar recibo
CREATE OR REPLACE FUNCTION approve_payment_submission(submission_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_rec RECORD;
  v_payment_id UUID;
BEGIN
  -- Obtener submission
  SELECT * INTO submission_rec
  FROM pms_payment_submissions
  WHERE id = submission_id_param
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission no encontrada o ya procesada';
  END IF;

  -- Crear registro de pago
  INSERT INTO pms_payments (
    contract_id, tenant_id, payment_type, amount, paid_amount,
    currency, due_date, paid_date, status, payment_method,
    reference_number, receipt_url, notes
  )
  SELECT 
    submission_rec.contract_id,
    submission_rec.tenant_id,
    'Alquiler',
    submission_rec.paid_amount,
    submission_rec.paid_amount,
    'ARS',
    (SELECT period_date FROM pms_payment_schedule_items WHERE id = submission_rec.schedule_item_id),
    submission_rec.paid_date,
    'paid',
    submission_rec.payment_method,
    submission_rec.reference_number,
    submission_rec.receipt_url,
    submission_rec.notes
  RETURNING id INTO v_payment_id;

  -- Actualizar schedule item
  UPDATE pms_payment_schedule_items
  SET status = 'paid',
      payment_id = v_payment_id,
      updated_at = NOW()
  WHERE id = submission_rec.schedule_item_id;

  -- Actualizar submission
  UPDATE pms_payment_submissions
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE id = submission_id_param;
  
  -- Crear recibo pendiente (el trigger lo procesará)
  INSERT INTO pms_payment_receipts (
    tenant_id,
    payment_id,
    contract_id,
    receipt_number,
    receipt_date,
    status
  ) VALUES (
    submission_rec.tenant_id,
    v_payment_id,
    submission_rec.contract_id,
    generate_receipt_number(submission_rec.tenant_id),
    CURRENT_DATE,
    'pending'
  );
END;
$$;

-- 9. Crear Storage Bucket (mediante INSERT directo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 10. RLS Policies para Storage Bucket payment-receipts
CREATE POLICY "Staff can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-receipts' AND
  (
    has_pms_role(auth.uid(), 'SUPERADMIN') OR
    has_pms_role(auth.uid(), 'INMOBILIARIA') OR
    has_pms_role(auth.uid(), 'ADMINISTRADOR')
  )
);

CREATE POLICY "Staff can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  (
    has_pms_role(auth.uid(), 'SUPERADMIN') OR
    has_pms_role(auth.uid(), 'INMOBILIARIA') OR
    has_pms_role(auth.uid(), 'ADMINISTRADOR')
  )
);

CREATE POLICY "Users can download their receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  (
    EXISTS (
      SELECT 1 FROM pms_payment_receipts pr
      JOIN pms_payments p ON p.id = pr.payment_id
      JOIN pms_contracts c ON c.id = p.contract_id
      WHERE pr.pdf_url = storage.objects.name
      AND (
        c.tenant_renter_id IN (
          SELECT id FROM pms_tenants_renters WHERE user_id = auth.uid()
        )
        OR
        c.property_id IN (
          SELECT property_id FROM pms_owner_properties op
          JOIN pms_owners o ON o.id = op.owner_id
          WHERE o.user_id = auth.uid()
            AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
        )
      )
    )
    OR
    has_pms_role(auth.uid(), 'SUPERADMIN') OR
    has_pms_role(auth.uid(), 'INMOBILIARIA') OR
    has_pms_role(auth.uid(), 'ADMINISTRADOR')
  )
);