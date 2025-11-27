-- ============================================================================
-- SECURITY FIX: Enable RLS on tables with disabled RLS
-- ============================================================================
-- Fecha: 2025-01-27
-- Descripción: Habilitar Row Level Security en tablas que tienen policies
--              definidas pero RLS deshabilitado, lo que hace que las policies
--              no se apliquen.

-- 1. Habilitar RLS en subscription_change_history
ALTER TABLE subscription_change_history ENABLE ROW LEVEL SECURITY;

-- 2. Habilitar RLS en subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 3. Habilitar RLS en subscription_requests
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

-- Verificar que las policies existentes sean correctas
-- Las policies ya existen en estas tablas, solo necesitamos habilitar RLS

-- Comentarios:
-- subscription_change_history: Solo Granada admins y service_role deben tener acceso
-- subscription_plans: Puede ser público para lectura, restringir escritura
-- subscription_requests: Solo el tenant que lo creó y Granada admins deben ver

COMMENT ON TABLE subscription_change_history IS 'RLS habilitado - Solo Granada admins y service_role tienen acceso';
COMMENT ON TABLE subscription_plans IS 'RLS habilitado - Lectura pública, escritura restringida a Granada admins';
COMMENT ON TABLE subscription_requests IS 'RLS habilitado - Acceso restringido por tenant y Granada admins';