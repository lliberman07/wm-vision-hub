-- Crear ENUM para módulos de Granada
CREATE TYPE granada_module AS ENUM (
  'dashboard',
  'analytics',
  'subscription_requests',
  'contacts',
  'clients',
  'client_users',
  'platform_users',
  'subscription_plans',
  'subscriptions',
  'payments'
);

-- Tabla de permisos granulares para GRANADA_ADMIN
CREATE TABLE public.granada_user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module granada_module NOT NULL,
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module)
);

-- Habilitar RLS
ALTER TABLE public.granada_user_permissions ENABLE ROW LEVEL SECURITY;

-- Política: Solo GRANADA_SUPERADMIN puede gestionar permisos
CREATE POLICY "Only GRANADA_SUPERADMIN can manage permissions"
  ON public.granada_user_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM granada_platform_users
      WHERE user_id = auth.uid()
        AND role = 'GRANADA_SUPERADMIN'
        AND is_active = true
    )
  );

-- Política: Los usuarios pueden ver sus propios permisos
CREATE POLICY "Users can view their own permissions"
  ON public.granada_user_permissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Función helper para verificar permisos de módulo
CREATE OR REPLACE FUNCTION has_granada_module_permission(
  _user_id UUID,
  _module TEXT,
  _permission TEXT DEFAULT 'read'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  has_permission BOOLEAN;
BEGIN
  -- Verificar si es GRANADA_SUPERADMIN (acceso total)
  SELECT role::TEXT INTO user_role
  FROM granada_platform_users
  WHERE user_id = _user_id
    AND is_active = true;
  
  IF user_role = 'GRANADA_SUPERADMIN' THEN
    RETURN true;
  END IF;
  
  -- Verificar permiso específico para GRANADA_ADMIN
  IF _permission = 'read' THEN
    SELECT can_read INTO has_permission
    FROM granada_user_permissions
    WHERE user_id = _user_id
      AND module = _module::granada_module;
  ELSIF _permission = 'write' THEN
    SELECT can_write INTO has_permission
    FROM granada_user_permissions
    WHERE user_id = _user_id
      AND module = _module::granada_module;
  ELSIF _permission = 'delete' THEN
    SELECT can_delete INTO has_permission
    FROM granada_user_permissions
    WHERE user_id = _user_id
      AND module = _module::granada_module;
  END IF;
  
  RETURN COALESCE(has_permission, false);
END;
$$;