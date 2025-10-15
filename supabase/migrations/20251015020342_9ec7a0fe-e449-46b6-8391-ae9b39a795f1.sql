-- Agregar rol INQUILINO al enum pms_app_role
ALTER TYPE pms_app_role ADD VALUE IF NOT EXISTS 'INQUILINO';

-- Crear tabla para pagos informados por inquilinos
CREATE TABLE IF NOT EXISTS pms_payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES pms_contracts(id) ON DELETE CASCADE,
  schedule_item_id UUID NOT NULL REFERENCES pms_payment_schedule_items(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL,
  
  -- Datos del pago informado
  paid_date DATE NOT NULL,
  paid_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  receipt_url TEXT,
  notes TEXT,
  
  -- Estado de revisión
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_payment_submissions_contract ON pms_payment_submissions(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_status ON pms_payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_tenant ON pms_payment_submissions(tenant_id);

-- Habilitar RLS
ALTER TABLE pms_payment_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: INQUILINO puede crear y ver sus propias submissions
CREATE POLICY "INQUILINO can manage own submissions"
ON pms_payment_submissions
FOR ALL
TO authenticated
USING (
  submitted_by = auth.uid() AND
  has_pms_role(auth.uid(), 'INQUILINO', tenant_id)
)
WITH CHECK (
  submitted_by = auth.uid() AND
  has_pms_role(auth.uid(), 'INQUILINO', tenant_id)
);

-- Policy: INMOBILIARIA, ADMINISTRADOR y PROPIETARIO pueden ver y actualizar submissions
CREATE POLICY "Staff can manage submissions"
ON pms_payment_submissions
FOR ALL
TO authenticated
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id) OR
  has_pms_role(auth.uid(), 'PROPIETARIO', tenant_id)
);

-- Crear bucket para comprobantes de pago
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: INQUILINO puede subir sus propios comprobantes
CREATE POLICY "INQUILINO can upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: INQUILINO puede ver sus propios comprobantes
CREATE POLICY "INQUILINO can view own receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Staff puede ver todos los comprobantes
CREATE POLICY "Staff can view all receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND module = 'PMS'
    AND role::text IN ('SUPERADMIN', 'INMOBILIARIA', 'ADMINISTRADOR', 'PROPIETARIO')
    AND status = 'approved'
  )
);

-- Función para aprobar pago informado
CREATE OR REPLACE FUNCTION approve_payment_submission(submission_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_rec RECORD;
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
  RETURNING id INTO submission_rec;

  -- Actualizar schedule item
  UPDATE pms_payment_schedule_items
  SET status = 'paid',
      payment_id = submission_rec.id,
      updated_at = NOW()
  WHERE id = submission_rec.schedule_item_id;

  -- Actualizar submission
  UPDATE pms_payment_submissions
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE id = submission_id_param;
END;
$$;