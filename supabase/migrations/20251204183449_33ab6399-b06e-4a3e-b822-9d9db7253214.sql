-- Corregir vistas sin security_invoker para que respeten RLS
-- Esto hace que las vistas ejecuten con los permisos del usuario que consulta,
-- no con los permisos del creador de la vista (postgres)

-- 1. tenants_exceeding_limits - Vista de tenants sobre límites
ALTER VIEW public.tenants_exceeding_limits SET (security_invoker = on);

-- 2. v_current_user_tenants - Vista de tenants del usuario actual
ALTER VIEW public.v_current_user_tenants SET (security_invoker = on);

-- 3. v_roles_extended - Vista de roles extendida
ALTER VIEW public.v_roles_extended SET (security_invoker = on);

-- 4. v_user_linking_audit_report - Reporte de auditoría de vinculación
ALTER VIEW public.v_user_linking_audit_report SET (security_invoker = on);