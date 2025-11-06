-- ============================================================================
-- FASE 1: Funciones de Seguridad y Permisos para Gestión Jerárquica de Roles
-- ============================================================================

-- Función: Verificar si un usuario puede gestionar roles de un tenant específico
CREATE OR REPLACE FUNCTION public.can_manage_tenant_roles(
  p_user_id UUID, 
  p_target_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_superadmin BOOLEAN;
  v_user_tenant_id UUID;
  v_is_inmobiliaria BOOLEAN;
  v_target_parent_id UUID;
BEGIN
  -- Verificar si es SUPERADMIN
  SELECT has_pms_role(p_user_id, 'SUPERADMIN') INTO v_is_superadmin;
  IF v_is_superadmin THEN
    RETURN TRUE;
  END IF;

  -- Obtener el tenant del usuario INMOBILIARIA
  SELECT ur.tenant_id INTO v_user_tenant_id
  FROM user_roles ur
  WHERE ur.user_id = p_user_id 
    AND ur.module = 'PMS'
    AND ur.role = 'INMOBILIARIA'
    AND ur.status = 'approved'
  LIMIT 1;

  IF v_user_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Si el tenant objetivo es el mismo que el del usuario
  IF v_user_tenant_id = p_target_tenant_id THEN
    RETURN TRUE;
  END IF;

  -- Verificar si el tenant objetivo es una sucursal del tenant del usuario
  SELECT (settings->>'parent_tenant_id')::UUID INTO v_target_parent_id
  FROM pms_tenants
  WHERE id = p_target_tenant_id;

  IF v_target_parent_id = v_user_tenant_id THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Función: Obtener lista de tenants que un usuario puede gestionar
CREATE OR REPLACE FUNCTION public.get_manageable_tenants(p_user_id UUID)
RETURNS TABLE(tenant_id UUID, tenant_name TEXT, is_branch BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_superadmin BOOLEAN;
  v_user_tenant_id UUID;
BEGIN
  -- Verificar si es SUPERADMIN
  SELECT has_pms_role(p_user_id, 'SUPERADMIN') INTO v_is_superadmin;
  
  IF v_is_superadmin THEN
    -- SUPERADMIN puede gestionar todos los tenants
    RETURN QUERY
    SELECT 
      t.id,
      t.name,
      CASE 
        WHEN t.settings->>'parent_tenant_id' IS NOT NULL THEN TRUE
        ELSE FALSE
      END
    FROM pms_tenants t
    ORDER BY t.name;
  ELSE
    -- Obtener tenant del usuario INMOBILIARIA
    SELECT ur.tenant_id INTO v_user_tenant_id
    FROM user_roles ur
    WHERE ur.user_id = p_user_id 
      AND ur.module = 'PMS'
      AND ur.role = 'INMOBILIARIA'
      AND ur.status = 'approved'
    LIMIT 1;

    IF v_user_tenant_id IS NOT NULL THEN
      -- Retornar el tenant propio + sucursales
      RETURN QUERY
      SELECT 
        t.id,
        t.name,
        CASE 
          WHEN t.id = v_user_tenant_id THEN FALSE
          ELSE TRUE
        END
      FROM pms_tenants t
      WHERE t.id = v_user_tenant_id
         OR (t.settings->>'parent_tenant_id')::UUID = v_user_tenant_id
      ORDER BY is_branch, t.name;
    END IF;
  END IF;
END;
$$;

-- Función: Validar si un rol puede ser asignado por un usuario
CREATE OR REPLACE FUNCTION public.validate_role_assignment(
  p_user_id UUID, 
  p_target_tenant_id UUID, 
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_superadmin BOOLEAN;
  v_can_manage BOOLEAN;
  v_max_users INTEGER;
  v_current_users INTEGER;
  v_tenant_settings JSONB;
BEGIN
  -- Verificar si es SUPERADMIN
  SELECT has_pms_role(p_user_id, 'SUPERADMIN') INTO v_is_superadmin;
  
  IF v_is_superadmin THEN
    -- SUPERADMIN puede asignar cualquier rol
    RETURN jsonb_build_object(
      'valid', TRUE,
      'message', 'SUPERADMIN tiene permisos totales'
    );
  END IF;

  -- Verificar si puede gestionar el tenant
  SELECT can_manage_tenant_roles(p_user_id, p_target_tenant_id) INTO v_can_manage;
  
  IF NOT v_can_manage THEN
    RETURN jsonb_build_object(
      'valid', FALSE,
      'message', 'No tienes permisos para gestionar este tenant'
    );
  END IF;

  -- Casa Matriz NO puede asignar roles INMOBILIARIA o SUPERADMIN a sucursales
  IF p_role IN ('INMOBILIARIA', 'SUPERADMIN') THEN
    RETURN jsonb_build_object(
      'valid', FALSE,
      'message', 'No puedes asignar roles de ' || p_role || ' a sucursales'
    );
  END IF;

  -- Verificar límite de usuarios
  SELECT settings INTO v_tenant_settings
  FROM pms_tenants
  WHERE id = p_target_tenant_id;

  v_max_users := COALESCE((v_tenant_settings->>'max_users')::INTEGER, 5);

  SELECT COUNT(DISTINCT user_id) INTO v_current_users
  FROM user_roles
  WHERE tenant_id = p_target_tenant_id
    AND module = 'PMS'
    AND status = 'approved';

  IF v_current_users >= v_max_users THEN
    RETURN jsonb_build_object(
      'valid', FALSE,
      'message', 'Se ha alcanzado el límite de usuarios (' || v_max_users || ') para este tenant'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', TRUE,
    'message', 'Validación exitosa'
  );
END;
$$;

-- ============================================================================
-- Agregar campo de recomendación a pms_access_requests
-- ============================================================================

ALTER TABLE pms_access_requests 
ADD COLUMN IF NOT EXISTS recommended_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS recommended_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- Actualizar RLS Policies para pms_access_requests
-- ============================================================================

-- Permitir que Casa Matriz vea solicitudes de sus sucursales
DROP POLICY IF EXISTS "INMOBILIARIA can view branch requests" ON pms_access_requests;
CREATE POLICY "INMOBILIARIA can view branch requests"
ON pms_access_requests
FOR SELECT
TO authenticated
USING (
  can_manage_tenant_roles(auth.uid(), tenant_id)
);

-- Permitir que Casa Matriz recomiende (UPDATE) solicitudes de sus sucursales
DROP POLICY IF EXISTS "INMOBILIARIA can recommend branch requests" ON pms_access_requests;
CREATE POLICY "INMOBILIARIA can recommend branch requests"
ON pms_access_requests
FOR UPDATE
TO authenticated
USING (
  can_manage_tenant_roles(auth.uid(), tenant_id)
  AND status = 'pending'
)
WITH CHECK (
  can_manage_tenant_roles(auth.uid(), tenant_id)
);

-- Crear índice para mejorar performance de consultas jerárquicas
CREATE INDEX IF NOT EXISTS idx_pms_access_requests_tenant_status 
ON pms_access_requests(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_pms_access_requests_recommended 
ON pms_access_requests(recommended_by, recommended_at) 
WHERE recommended_by IS NOT NULL;