-- Crear bucket público para fotos de propiedades
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política: usuarios PMS autenticados pueden subir
CREATE POLICY "PMS users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-photos'
  AND (
    has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role)
    OR has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role)
    OR has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role)
  )
);

-- Política: cualquiera puede ver las fotos
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-photos');

-- Política: usuarios PMS pueden eliminar
CREATE POLICY "PMS users can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-photos'
  AND (
    has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role)
    OR has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role)
    OR has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role)
  )
);