-- 1. Primero agregar columna email como nullable
ALTER TABLE pms_access_requests 
ADD COLUMN IF NOT EXISTS email text;

-- 2. Actualizar registros existentes sin email usando un placeholder
-- En producción, deberías contactar a estos usuarios para obtener sus emails reales
UPDATE pms_access_requests 
SET email = CONCAT('pending-', id, '@placeholder.com')
WHERE email IS NULL;

-- 3. Ahora sí, hacer la columna obligatoria
ALTER TABLE pms_access_requests
ALTER COLUMN email SET NOT NULL;

-- 4. Crear índice en email para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_pms_access_requests_email 
ON pms_access_requests(email);

-- 5. Migrar datos existentes de pms_user_roles a user_roles
INSERT INTO user_roles (user_id, role, module, tenant_id, status, created_at)
SELECT 
  user_id,
  role::text::user_role_type,
  'PMS'::module_type,
  tenant_id,
  'approved'::request_status,
  created_at
FROM pms_user_roles
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = pms_user_roles.user_id 
    AND ur.module = 'PMS'
    AND ur.tenant_id = pms_user_roles.tenant_id
)
ON CONFLICT DO NOTHING;

-- 6. Eliminar tabla pms_user_roles (ya no se usa)
DROP TABLE IF EXISTS pms_user_roles CASCADE;

-- 7. Actualizar política RLS para que admins puedan gestionar solicitudes PMS
DROP POLICY IF EXISTS "Admins can manage PMS requests" ON pms_access_requests;
CREATE POLICY "Admins can manage PMS requests"
ON pms_access_requests
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- 8. Comentarios para documentar el sistema unificado
COMMENT ON TABLE user_roles IS 'Tabla unificada de roles para todos los módulos (WM, PMS). Usa la columna module para diferenciar.';
COMMENT ON TABLE pms_access_requests IS 'Solicitudes de acceso al PMS. El user_id es NULL hasta que el admin apruebe y cree la cuenta en auth.users.';