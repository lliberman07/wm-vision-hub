-- =====================================================
-- FASE 1: Tabla de Auditoría para Usuarios Multi-Tenant
-- =====================================================

-- Crear tabla de auditoría para todas las operaciones de verificación y vinculación
CREATE TABLE IF NOT EXISTS public.pms_user_linking_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información del evento
  event_type TEXT NOT NULL, -- 'email_verification', 'user_creation', 'user_linking', 'cross_tenant_detected', 'user_reactivation'
  event_status TEXT NOT NULL, -- 'success', 'failed', 'warning'
  
  -- Actor (quién ejecutó la acción)
  action_by UUID REFERENCES auth.users(id),
  action_by_email TEXT,
  action_by_tenant_id UUID REFERENCES pms_tenants(id),
  action_by_tenant_name TEXT,
  
  -- Target (usuario afectado)
  target_email TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_user_type TEXT, -- 'INQUILINO', 'PROPIETARIO', 'CLIENT_ADMIN'
  
  -- Contexto del tenant
  target_tenant_id UUID REFERENCES pms_tenants(id),
  target_tenant_name TEXT,
  
  -- Información cross-tenant (si aplica)
  existing_tenants JSONB, -- [{tenant_id, tenant_name, user_type, created_at}]
  is_cross_tenant_link BOOLEAN DEFAULT false,
  
  -- Entidades relacionadas
  contract_id UUID REFERENCES pms_contracts(id),
  owner_id UUID REFERENCES pms_owners(id),
  tenant_renter_id UUID REFERENCES pms_tenants_renters(id),
  
  -- Metadata adicional
  ip_address TEXT,
  user_agent TEXT,
  request_source TEXT, -- 'form', 'contract_activation', 'api'
  metadata JSONB,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios para documentación
COMMENT ON TABLE public.pms_user_linking_audit IS 'Auditoría completa de verificaciones y vinculaciones de usuarios multi-tenant';
COMMENT ON COLUMN public.pms_user_linking_audit.event_type IS 'Tipo de evento: email_verification, user_creation, user_linking, cross_tenant_detected, user_reactivation';
COMMENT ON COLUMN public.pms_user_linking_audit.event_status IS 'Estado del evento: success, failed, warning';
COMMENT ON COLUMN public.pms_user_linking_audit.is_cross_tenant_link IS 'Indica si el usuario tiene acceso a múltiples tenants';

-- =====================================================
-- Índices para Performance
-- =====================================================

CREATE INDEX idx_user_linking_audit_email ON public.pms_user_linking_audit(target_email);
CREATE INDEX idx_user_linking_audit_target_user ON public.pms_user_linking_audit(target_user_id);
CREATE INDEX idx_user_linking_audit_tenant ON public.pms_user_linking_audit(target_tenant_id);
CREATE INDEX idx_user_linking_audit_event_type ON public.pms_user_linking_audit(event_type);
CREATE INDEX idx_user_linking_audit_event_status ON public.pms_user_linking_audit(event_status);
CREATE INDEX idx_user_linking_audit_created ON public.pms_user_linking_audit(created_at DESC);
CREATE INDEX idx_user_linking_audit_cross_tenant ON public.pms_user_linking_audit(is_cross_tenant_link) WHERE is_cross_tenant_link = true;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.pms_user_linking_audit ENABLE ROW LEVEL SECURITY;

-- Granada admins pueden ver todos los logs
CREATE POLICY "Granada admins can view all audit logs"
  ON public.pms_user_linking_audit
  FOR SELECT
  USING (is_granada_admin(auth.uid()));

-- Client admins pueden ver logs de su tenant
CREATE POLICY "Client admins can view their tenant audit logs"
  ON public.pms_user_linking_audit
  FOR SELECT
  USING (
    is_client_admin(auth.uid(), target_tenant_id)
  );

-- Sistema puede insertar logs (service role)
CREATE POLICY "System can insert audit logs"
  ON public.pms_user_linking_audit
  FOR INSERT
  WITH CHECK (true);

-- Solo Granada superadmin puede eliminar logs (para limpieza)
CREATE POLICY "Only Granada superadmin can delete audit logs"
  ON public.pms_user_linking_audit
  FOR DELETE
  USING (is_granada_superadmin(auth.uid()));

-- =====================================================
-- FASE 2: RPC de Verificación Global con Auto-Logging
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_email_exists_globally(
  p_email TEXT,
  p_current_tenant_id UUID,
  p_action_by UUID DEFAULT NULL,
  p_request_source TEXT DEFAULT 'form'
)
RETURNS TABLE (
  exists_in_auth BOOLEAN,
  auth_user_id UUID,
  exists_in_current_tenant BOOLEAN,
  current_tenant_roles TEXT[],
  other_tenants JSONB
)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_other_tenants JSONB;
  v_exists_in_current BOOLEAN;
  v_current_roles TEXT[];
BEGIN
  -- Normalizar email
  p_email := LOWER(TRIM(p_email));
  
  -- 1. Buscar en auth.users
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = p_email;
  
  -- 2. Verificar si existe en el tenant actual
  SELECT 
    COUNT(*) > 0,
    ARRAY_AGG(DISTINCT user_type::TEXT)
  INTO v_exists_in_current, v_current_roles
  FROM pms_client_users
  WHERE email = p_email
    AND tenant_id = p_current_tenant_id
    AND is_active = true;
  
  -- 3. Buscar en otros tenants (excluir el actual)
  SELECT jsonb_agg(DISTINCT jsonb_build_object(
    'tenant_id', cu.tenant_id,
    'tenant_name', t.name,
    'user_type', cu.user_type,
    'is_active', cu.is_active,
    'created_at', cu.created_at
  ))
  INTO v_other_tenants
  FROM pms_client_users cu
  JOIN pms_tenants t ON t.id = cu.tenant_id
  WHERE cu.email = p_email
    AND cu.tenant_id != p_current_tenant_id
    AND cu.is_active = true;
  
  -- 4. Registrar la verificación en auditoría
  INSERT INTO pms_user_linking_audit (
    event_type, 
    event_status, 
    action_by, 
    target_email,
    target_user_id,
    target_tenant_id, 
    existing_tenants, 
    is_cross_tenant_link,
    request_source,
    metadata
  ) VALUES (
    'email_verification', 
    CASE 
      WHEN v_auth_user_id IS NOT NULL AND v_other_tenants IS NOT NULL THEN 'warning'
      WHEN v_auth_user_id IS NOT NULL THEN 'success'
      ELSE 'success' 
    END,
    p_action_by, 
    p_email,
    v_auth_user_id,
    p_current_tenant_id,
    v_other_tenants,
    (v_other_tenants IS NOT NULL AND jsonb_array_length(COALESCE(v_other_tenants, '[]'::jsonb)) > 0),
    p_request_source,
    jsonb_build_object(
      'exists_in_auth', v_auth_user_id IS NOT NULL,
      'exists_in_current_tenant', COALESCE(v_exists_in_current, false),
      'other_tenants_count', jsonb_array_length(COALESCE(v_other_tenants, '[]'::jsonb))
    )
  );
  
  -- 5. Retornar resultados
  RETURN QUERY SELECT 
    v_auth_user_id IS NOT NULL,
    v_auth_user_id,
    COALESCE(v_exists_in_current, false),
    COALESCE(v_current_roles, ARRAY[]::TEXT[]),
    COALESCE(v_other_tenants, '[]'::jsonb);
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION public.check_email_exists_globally IS 'Verifica si un email existe en auth.users y otros tenants. Auto-registra en auditoría.';

-- =====================================================
-- Función Helper para Logging desde Edge Functions
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_user_linking_event(
  p_event_type TEXT,
  p_event_status TEXT,
  p_target_email TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_user_type TEXT DEFAULT NULL,
  p_target_tenant_id UUID DEFAULT NULL,
  p_action_by UUID DEFAULT NULL,
  p_is_cross_tenant_link BOOLEAN DEFAULT false,
  p_existing_tenants JSONB DEFAULT NULL,
  p_contract_id UUID DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL,
  p_tenant_renter_id UUID DEFAULT NULL,
  p_request_source TEXT DEFAULT 'api',
  p_metadata JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO pms_user_linking_audit (
    event_type,
    event_status,
    target_email,
    target_user_id,
    target_user_type,
    target_tenant_id,
    action_by,
    is_cross_tenant_link,
    existing_tenants,
    contract_id,
    owner_id,
    tenant_renter_id,
    request_source,
    metadata,
    error_message
  ) VALUES (
    p_event_type,
    p_event_status,
    LOWER(TRIM(p_target_email)),
    p_target_user_id,
    p_target_user_type,
    p_target_tenant_id,
    p_action_by,
    p_is_cross_tenant_link,
    p_existing_tenants,
    p_contract_id,
    p_owner_id,
    p_tenant_renter_id,
    p_request_source,
    p_metadata,
    p_error_message
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

COMMENT ON FUNCTION public.log_user_linking_event IS 'Helper function para registrar eventos de auditoría desde edge functions';

-- =====================================================
-- Vista para Reportes de Auditoría
-- =====================================================

CREATE OR REPLACE VIEW public.v_user_linking_audit_report AS
SELECT 
  a.id,
  a.event_type,
  a.event_status,
  a.target_email,
  a.target_user_type,
  a.is_cross_tenant_link,
  t.name as target_tenant_name,
  t.slug as target_tenant_slug,
  jsonb_array_length(COALESCE(a.existing_tenants, '[]'::jsonb)) as other_tenants_count,
  a.request_source,
  a.error_message,
  a.created_at,
  CASE 
    WHEN a.event_status = 'failed' THEN 'error'
    WHEN a.event_status = 'warning' THEN 'warning'
    ELSE 'info'
  END as severity
FROM pms_user_linking_audit a
LEFT JOIN pms_tenants t ON t.id = a.target_tenant_id
ORDER BY a.created_at DESC;

COMMENT ON VIEW public.v_user_linking_audit_report IS 'Vista simplificada para reportes de auditoría en Granada Admin';