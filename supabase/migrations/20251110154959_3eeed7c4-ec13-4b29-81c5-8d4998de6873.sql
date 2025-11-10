-- Crear bucket para documentos de contratos (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-documents',
  'contract-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- RLS Policy: Staff puede subir documentos de contratos
CREATE POLICY "Staff can upload contract documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-documents' AND
  (
    has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
    has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role) OR
    has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role)
  )
);

-- RLS Policy: Staff puede leer documentos de sus tenants
CREATE POLICY "Staff can read contract documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-documents' AND
  (
    has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pms_contracts c ON c.tenant_id = ur.tenant_id
      WHERE ur.user_id = auth.uid()
      AND ur.module = 'PMS'
      AND ur.status = 'approved'
      AND ur.role::text IN ('INMOBILIARIA', 'ADMINISTRADOR')
      AND c.id::text = (storage.foldername(name))[1]
    )
  )
);

-- RLS Policy: Staff puede eliminar documentos de contratos
CREATE POLICY "Staff can delete contract documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contract-documents' AND
  (
    has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pms_contracts c ON c.tenant_id = ur.tenant_id
      WHERE ur.user_id = auth.uid()
      AND ur.module = 'PMS'
      AND ur.status = 'approved'
      AND ur.role::text IN ('INMOBILIARIA', 'ADMINISTRADOR')
      AND c.id::text = (storage.foldername(name))[1]
    )
  )
);

-- Propietarios pueden ver documentos de sus contratos
CREATE POLICY "Owners can read their contract documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-documents' AND
  EXISTS (
    SELECT 1 FROM pms_contracts c
    JOIN pms_owner_properties op ON op.property_id = c.property_id
    JOIN pms_owners o ON o.id = op.owner_id
    WHERE o.user_id = auth.uid()
    AND c.id::text = (storage.foldername(name))[1]
    AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
  )
);

-- Inquilinos pueden ver documentos de su contrato activo
CREATE POLICY "Tenants can read their contract documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-documents' AND
  EXISTS (
    SELECT 1 FROM pms_contracts c
    JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
    WHERE tr.user_id = auth.uid()
    AND c.id::text = (storage.foldername(name))[1]
    AND c.status = 'active'
  )
);