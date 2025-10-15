-- Crear políticas RLS para pms_payment_distributions

-- Permitir lectura a staff
CREATE POLICY "Staff can view payment distributions"
ON pms_payment_distributions
FOR SELECT
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);

-- Permitir a propietarios ver sus propias distribuciones
CREATE POLICY "Owners can view their distributions"
ON pms_payment_distributions
FOR SELECT
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id) AND
  owner_id IN (
    SELECT id FROM pms_owners WHERE user_id = auth.uid()
  )
);

-- Permitir al staff gestionar distribuciones
CREATE POLICY "Staff can manage distributions"
ON pms_payment_distributions
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);