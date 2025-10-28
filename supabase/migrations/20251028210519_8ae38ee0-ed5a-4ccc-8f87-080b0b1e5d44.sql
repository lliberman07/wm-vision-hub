-- Eliminar políticas antiguas del bucket property-photos
DROP POLICY IF EXISTS "PMS users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "PMS users can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;

-- Crear nuevas políticas con el sistema de roles actualizado
-- Política: usuarios PMS autenticados pueden subir fotos
CREATE POLICY "PMS users can upload property photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-photos'
  AND EXISTS (
    SELECT 1 FROM get_user_pms_role(auth.uid())
    WHERE role IN ('superadmin', 'admin', 'owner')
  )
);

-- Política: cualquiera puede ver las fotos (bucket público)
CREATE POLICY "Anyone can view property photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-photos');

-- Política: usuarios PMS pueden eliminar fotos
CREATE POLICY "PMS users can delete property photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-photos'
  AND EXISTS (
    SELECT 1 FROM get_user_pms_role(auth.uid())
    WHERE role IN ('superadmin', 'admin', 'owner')
  )
);

-- Política: usuarios PMS pueden actualizar fotos
CREATE POLICY "PMS users can update property photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-photos'
  AND EXISTS (
    SELECT 1 FROM get_user_pms_role(auth.uid())
    WHERE role IN ('superadmin', 'admin', 'owner')
  )
);