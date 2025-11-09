-- Función para contar usuarios que SÍ consumen licencia del tenant
-- Excluye INQUILINO (siempre) y PROPIETARIO (cuando no es tenant tipo 'propietario')
CREATE OR REPLACE FUNCTION get_tenant_consuming_users_count(p_tenant_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_tenant_type pms_tenant_type;
BEGIN
  -- Obtener tipo de tenant
  SELECT tenant_type INTO v_tenant_type
  FROM pms_tenants
  WHERE id = p_tenant_id;

  IF v_tenant_type IS NULL THEN
    RETURN 0;
  END IF;

  -- Contar usuarios únicos que consumen licencia
  SELECT COUNT(DISTINCT ur.user_id)::INTEGER
  INTO v_count
  FROM user_roles ur
  WHERE ur.tenant_id = p_tenant_id
    AND ur.module = 'PMS'
    AND ur.status = 'approved'
    AND (
      -- Excluir INQUILINO siempre
      ur.role::text != 'inquilino'
      -- Excluir PROPIETARIO si NO es tenant tipo 'propietario'
      AND (ur.role::text != 'propietario' OR v_tenant_type = 'propietario')
    );

  RETURN COALESCE(v_count, 0);
END;
$$;

-- Función helper para validar si un rol consume licencia
CREATE OR REPLACE FUNCTION does_role_consume_license(
  p_role text,
  p_tenant_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_type pms_tenant_type;
BEGIN
  -- Normalizar rol a minúsculas
  p_role := lower(p_role);

  -- INQUILINO nunca consume licencia
  IF p_role = 'inquilino' THEN
    RETURN FALSE;
  END IF;

  -- PROPIETARIO solo consume si tenant es tipo 'propietario'
  IF p_role = 'propietario' THEN
    SELECT tenant_type INTO v_tenant_type
    FROM pms_tenants
    WHERE id = p_tenant_id;
    
    RETURN v_tenant_type = 'propietario';
  END IF;

  -- Todos los demás roles (superadmin, inmobiliaria, administrador, etc.) SÍ consumen
  RETURN TRUE;
END;
$$;