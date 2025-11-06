-- FASE 4: Auditoría y Logs de Roles PMS

-- Crear tabla de auditoría para roles PMS
CREATE TABLE IF NOT EXISTS public.pms_role_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('assigned', 'removed')),
  target_user_id UUID NOT NULL,
  target_user_email TEXT NOT NULL,
  tenant_id UUID REFERENCES public.pms_tenants(id) ON DELETE CASCADE NOT NULL,
  tenant_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_pms_role_audit_action_by ON public.pms_role_audit(action_by);
CREATE INDEX idx_pms_role_audit_target_user ON public.pms_role_audit(target_user_id);
CREATE INDEX idx_pms_role_audit_tenant ON public.pms_role_audit(tenant_id);
CREATE INDEX idx_pms_role_audit_created_at ON public.pms_role_audit(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.pms_role_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Solo SUPERADMIN y admins de WM pueden ver auditoría
CREATE POLICY "SUPERADMIN and WM admins can view audit logs"
ON public.pms_role_audit
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- Policy: INMOBILIARIA puede ver logs de su tenant y sucursales
CREATE POLICY "INMOBILIARIA can view their tenant audit logs"
ON public.pms_role_audit
FOR SELECT
TO authenticated
USING (
  can_manage_tenant_roles(auth.uid(), tenant_id)
);

-- Función trigger para auditoría automática
CREATE OR REPLACE FUNCTION public.audit_pms_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_type TEXT;
  v_user_email TEXT;
  v_tenant_name TEXT;
BEGIN
  -- Determinar tipo de acción
  IF (TG_OP = 'INSERT') THEN
    v_action_type := 'assigned';
  ELSIF (TG_OP = 'DELETE') THEN
    v_action_type := 'removed';
  ELSE
    RETURN NULL;
  END IF;

  -- Solo auditar cambios en módulo PMS con status approved
  IF (TG_OP = 'INSERT' AND NEW.module = 'PMS' AND NEW.status = 'approved') OR 
     (TG_OP = 'DELETE' AND OLD.module = 'PMS') THEN
    
    -- Obtener email del usuario objetivo
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);

    -- Obtener nombre del tenant
    SELECT name INTO v_tenant_name
    FROM pms_tenants
    WHERE id = COALESCE(NEW.tenant_id, OLD.tenant_id);

    -- Insertar registro de auditoría
    INSERT INTO public.pms_role_audit (
      action_by,
      action_type,
      target_user_id,
      target_user_email,
      tenant_id,
      tenant_name,
      role,
      metadata
    ) VALUES (
      auth.uid(),
      v_action_type,
      COALESCE(NEW.user_id, OLD.user_id),
      COALESCE(v_user_email, 'Unknown'),
      COALESCE(NEW.tenant_id, OLD.tenant_id),
      COALESCE(v_tenant_name, 'Unknown'),
      COALESCE(NEW.role::TEXT, OLD.role::TEXT),
      jsonb_build_object(
        'role_id', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP,
        'timestamp', now()
      )
    );
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Crear trigger en user_roles
DROP TRIGGER IF EXISTS audit_pms_role_changes_trigger ON public.user_roles;
CREATE TRIGGER audit_pms_role_changes_trigger
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_pms_role_changes();

COMMENT ON TABLE public.pms_role_audit IS 'Registro de auditoría para asignaciones y eliminaciones de roles PMS';
COMMENT ON TRIGGER audit_pms_role_changes_trigger ON public.user_roles IS 'Audita automáticamente cambios en roles PMS';