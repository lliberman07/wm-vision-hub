-- 1. Políticas para pms_owners (CLIENT_ADMIN)
CREATE POLICY "CLIENT_ADMIN can insert owners in their tenant"
ON pms_owners
FOR INSERT
TO public
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM pms_client_users
    WHERE user_id = auth.uid()
    AND user_type = 'CLIENT_ADMIN'
    AND is_active = true
  )
);

CREATE POLICY "CLIENT_ADMIN can update owners in their tenant"
ON pms_owners
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM pms_client_users
    WHERE user_id = auth.uid()
    AND user_type = 'CLIENT_ADMIN'
    AND is_active = true
  )
);

CREATE POLICY "CLIENT_ADMIN can delete owners in their tenant"
ON pms_owners
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM pms_client_users
    WHERE user_id = auth.uid()
    AND user_type = 'CLIENT_ADMIN'
    AND is_active = true
  )
);

-- 2. Políticas para pms_properties (CLIENT_ADMIN)
CREATE POLICY "CLIENT_ADMIN can insert properties in their tenant"
ON pms_properties
FOR INSERT
TO public
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM pms_client_users
    WHERE user_id = auth.uid()
    AND user_type = 'CLIENT_ADMIN'
    AND is_active = true
  )
);

CREATE POLICY "CLIENT_ADMIN can delete properties in their tenant"
ON pms_properties
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM pms_client_users
    WHERE user_id = auth.uid()
    AND user_type = 'CLIENT_ADMIN'
    AND is_active = true
  )
);

-- 3. Políticas de Storage para property-photos (CLIENT_ADMIN)
CREATE POLICY "CLIENT_ADMIN can upload property photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'property-photos'
  AND EXISTS (
    SELECT 1 FROM pms_client_users
    WHERE user_id = auth.uid()
    AND user_type = 'CLIENT_ADMIN'
    AND is_active = true
  )
);

CREATE POLICY "CLIENT_ADMIN can delete property photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'property-photos'
  AND EXISTS (
    SELECT 1 FROM pms_client_users
    WHERE user_id = auth.uid()
    AND user_type = 'CLIENT_ADMIN'
    AND is_active = true
  )
);