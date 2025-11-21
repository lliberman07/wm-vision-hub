-- ============================================================================
-- SECURITY REMEDIATION - PHASE 1 (LOW RISK)
-- ============================================================================
-- Description: Adds search_path protection to SECURITY DEFINER functions
--              and enables RLS on subscription_change_history
-- Risk Level: LOW
-- Rollback: See rollback script at end of file
-- 
-- HOW TO APPLY:
-- 1. Copy this entire script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run the script
-- 4. Run verification queries at the end
-- ============================================================================

-- ============================================================================
-- PART 1: Fix SECURITY DEFINER Functions - Add SET search_path = public
-- ============================================================================
-- These functions already exist and work correctly. We're only adding
-- search_path protection to prevent search path injection attacks.
-- The logic of each function remains UNCHANGED.
-- ============================================================================

-- Function: approve_user
-- Purpose: Allows superadmins to approve users
CREATE OR REPLACE FUNCTION public.approve_user(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ← ADDED PROTECTION
AS $function$
BEGIN
  -- Verificar que el usuario actual es superadmin
  IF NOT has_role(auth.uid(), 'superadmin'::user_role_type) THEN
    RAISE EXCEPTION 'Solo superadmins pueden aprobar usuarios';
  END IF;
  
  -- Actualizar user_roles
  UPDATE public.user_roles 
  SET status = 'approved'::request_status, 
      approved_at = now()
  WHERE user_id = user_id_param;
  
  -- Actualizar users
  UPDATE public.users
  SET approved = true
  WHERE id = user_id_param;
END;
$function$;

-- Function: deny_user
-- Purpose: Allows superadmins to deny users
CREATE OR REPLACE FUNCTION public.deny_user(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ← ADDED PROTECTION
AS $function$
BEGIN
  -- Verificar que el usuario actual es superadmin
  IF NOT has_role(auth.uid(), 'superadmin'::user_role_type) THEN
    RAISE EXCEPTION 'Solo superadmins pueden denegar usuarios';
  END IF;
  
  -- Actualizar user_roles
  UPDATE public.user_roles 
  SET status = 'denied'::request_status
  WHERE user_id = user_id_param;
  
  -- Actualizar users
  UPDATE public.users
  SET approved = false
  WHERE id = user_id_param;
END;
$function$;

-- Function: get_tenant_user_limit
-- Purpose: Gets user limit for a tenant based on their plan
CREATE OR REPLACE FUNCTION public.get_tenant_user_limit(tenant_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- ← ADDED PROTECTION
AS $function$
  SELECT COALESCE(
    (settings->'limits'->>'max_users')::integer,
    CASE tenant_type
      WHEN 'sistema' THEN 20
      WHEN 'inmobiliaria' THEN 2
      WHEN 'propietario' THEN 2
      WHEN 'inquilino' THEN 2
      WHEN 'administrador' THEN 2
      WHEN 'proveedor_servicios' THEN 1
      ELSE 2
    END
  )
  FROM pms_tenants
  WHERE id = tenant_id_param;
$function$;

-- Function: check_tenant_has_records
-- Purpose: Checks if a tenant has any data before deletion
CREATE OR REPLACE FUNCTION public.check_tenant_has_records(tenant_id_param uuid)
RETURNS TABLE(has_records boolean, total_records bigint, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ← ADDED PROTECTION
AS $function$
DECLARE
  properties_count BIGINT;
  contracts_count BIGINT;
  owners_count BIGINT;
  tenants_renters_count BIGINT;
  payments_count BIGINT;
  expenses_count BIGINT;
  user_roles_count BIGINT;
  total BIGINT;
BEGIN
  -- Contar registros en cada tabla relacionada
  SELECT COUNT(*) INTO properties_count 
  FROM pms_properties WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO contracts_count 
  FROM pms_contracts WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO owners_count 
  FROM pms_owners WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO tenants_renters_count 
  FROM pms_tenants_renters WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO payments_count 
  FROM pms_payments WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO expenses_count 
  FROM pms_expenses WHERE tenant_id = tenant_id_param;
  
  SELECT COUNT(*) INTO user_roles_count 
  FROM user_roles WHERE tenant_id = tenant_id_param AND module = 'PMS';
  
  -- Calcular total
  total := properties_count + contracts_count + owners_count + 
           tenants_renters_count + payments_count + expenses_count + user_roles_count;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    total > 0 AS has_records,
    total AS total_records,
    jsonb_build_object(
      'properties', properties_count,
      'contracts', contracts_count,
      'owners', owners_count,
      'tenants_renters', tenants_renters_count,
      'payments', payments_count,
      'expenses', expenses_count,
      'user_roles', user_roles_count
    ) AS details;
END;
$function$;

-- Function: get_user_by_email
-- Purpose: Retrieves user by email (used by edge functions)
CREATE OR REPLACE FUNCTION public.get_user_by_email(email_param text)
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public  -- ← ADDED PROTECTION
AS $function$
  SELECT id as user_id, email
  FROM auth.users
  WHERE email = email_param
  LIMIT 1;
$function$;

-- Function: get_property_auto_status
-- Purpose: Automatically determines property status based on contracts
CREATE OR REPLACE FUNCTION public.get_property_auto_status(property_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ← ADDED PROTECTION
AS $function$
DECLARE
  active_contract RECORD;
  manual_status TEXT;
BEGIN
  -- Obtener estado actual de la propiedad
  SELECT status INTO manual_status
  FROM pms_properties
  WHERE id = property_id_param;

  -- Si está en mantenimiento manual, respetar ese estado
  IF manual_status = 'maintenance' THEN
    RETURN 'maintenance';
  END IF;

  -- Buscar contrato activo vigente (no cancelado)
  SELECT * INTO active_contract
  FROM pms_contracts
  WHERE property_id = property_id_param
    AND status = 'active'
    AND end_date >= CURRENT_DATE
    AND start_date <= CURRENT_DATE
  ORDER BY start_date DESC
  LIMIT 1;

  -- Si existe contrato vigente → Alquilada
  IF FOUND THEN
    RETURN 'rented';
  ELSE
    -- Sin contrato vigente → Disponible
    RETURN 'available';
  END IF;
END;
$function$;

-- Function: validate_ownership_shares
-- Purpose: Ensures ownership shares don't exceed 100%
CREATE OR REPLACE FUNCTION public.validate_ownership_shares()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ← ADDED PROTECTION
AS $function$
DECLARE
  total_share numeric;
BEGIN
  SELECT COALESCE(SUM(share_percent), 0) INTO total_share
  FROM pms_owner_properties
  WHERE property_id = NEW.property_id
    AND (end_date IS NULL OR end_date > CURRENT_DATE)
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF total_share + NEW.share_percent > 100 THEN
    RAISE EXCEPTION 'La suma de porcentajes no puede exceder 100 por ciento';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: validate_payment_method_percentages
-- Purpose: Ensures payment method percentages don't exceed 100%
CREATE OR REPLACE FUNCTION public.validate_payment_method_percentages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ← ADDED PROTECTION
AS $function$
DECLARE
  total_percentage NUMERIC;
BEGIN
  -- Calcular suma de porcentajes para este contrato Y ESTE ITEM específico
  SELECT COALESCE(SUM(percentage), 0)
  INTO total_percentage
  FROM pms_contract_payment_methods
  WHERE contract_id = NEW.contract_id
    AND item = NEW.item  -- Filtrar por item específico (A o B)
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF total_percentage + NEW.percentage > 100 THEN
    RAISE EXCEPTION 'La suma de porcentajes para el item % no puede exceder 100 por ciento', NEW.item;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: distribute_payment_to_owners
-- Purpose: Distributes payment to property owners based on their share
CREATE OR REPLACE FUNCTION public.distribute_payment_to_owners()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ← ADDED PROTECTION
AS $function$
DECLARE
  owner_record RECORD;
  total_amount NUMERIC;
BEGIN
  IF NEW.status = 'paid' AND NEW.paid_amount > 0 THEN
    DELETE FROM pms_payment_distributions WHERE payment_id = NEW.id;
    
    total_amount := NEW.paid_amount;
    
    FOR owner_record IN
      SELECT op.owner_id, op.share_percent, op.tenant_id
      FROM pms_owner_properties op
      JOIN pms_contracts c ON c.property_id = op.property_id
      WHERE c.id = NEW.contract_id
        AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
    LOOP
      INSERT INTO pms_payment_distributions (
        payment_id, owner_id, tenant_id, contract_id,
        amount, share_percent, currency
      ) VALUES (
        NEW.id, owner_record.owner_id, owner_record.tenant_id, NEW.contract_id,
        total_amount * (owner_record.share_percent / 100),
        owner_record.share_percent, NEW.currency
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- PART 2: Enable RLS on subscription_change_history
-- ============================================================================
-- This table is currently used only server-side for audit/analytics.
-- Enabling RLS adds a security layer without breaking existing functionality
-- because edge functions use service_role key which bypasses RLS.
-- ============================================================================

-- Step 1: Enable RLS on the table
ALTER TABLE public.subscription_change_history ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies

-- Policy: Granada admins can view all subscription change history
CREATE POLICY "Granada admins can view subscription change history"
  ON public.subscription_change_history
  FOR SELECT
  TO authenticated
  USING (
    is_granada_admin(auth.uid())
  );

-- Policy: Service role can insert (used by edge functions and triggers)
CREATE POLICY "Service role can insert change history"
  ON public.subscription_change_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Granada admins can insert manually if needed
CREATE POLICY "Granada admins can insert change history"
  ON public.subscription_change_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_granada_admin(auth.uid())
  );

-- Policy: Granada admins can update change history (rare, but allowed)
CREATE POLICY "Granada admins can update change history"
  ON public.subscription_change_history
  FOR UPDATE
  TO authenticated
  USING (
    is_granada_admin(auth.uid())
  )
  WITH CHECK (
    is_granada_admin(auth.uid())
  );

-- Policy: Granada admins can delete change history (for data cleanup)
CREATE POLICY "Granada admins can delete change history"
  ON public.subscription_change_history
  FOR DELETE
  TO authenticated
  USING (
    is_granada_admin(auth.uid())
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after applying the migration to verify everything works:
-- ============================================================================

-- ✅ Query 1: Verify SECURITY DEFINER functions have search_path
SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN '✅ PROTECTED'
    ELSE '❌ MISSING'
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosecdef = true
  AND n.nspname = 'public'
  AND p.proname IN (
    'approve_user', 'deny_user', 'get_tenant_user_limit',
    'check_tenant_has_records', 'get_user_by_email',
    'get_property_auto_status', 'validate_ownership_shares',
    'validate_payment_method_percentages', 'distribute_payment_to_owners'
  )
ORDER BY function_name;
-- Expected: All functions show '✅ PROTECTED'

-- ✅ Query 2: Verify RLS is enabled on subscription_change_history
SELECT 
  tablename, 
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'subscription_change_history';
-- Expected: '✅ RLS ENABLED'

-- ✅ Query 3: Verify RLS policies exist
SELECT 
  policyname as policy_name,
  cmd as operation,
  CASE 
    WHEN roles = '{authenticated}' THEN 'authenticated'
    WHEN roles = '{service_role}' THEN 'service_role'
    ELSE array_to_string(roles, ', ')
  END as role
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'subscription_change_history'
ORDER BY cmd, policyname;
-- Expected: 5 policies (SELECT, INSERT x2, UPDATE, DELETE)

-- ============================================================================
-- TESTING CHECKLIST
-- ============================================================================
-- After running the script, test these scenarios:
-- ============================================================================

-- ✅ Test 1: Granada admin can view subscription_change_history
-- Login as Granada admin and run:
-- SELECT * FROM subscription_change_history LIMIT 5;
-- Expected: Should return records

-- ✅ Test 2: Regular user cannot view subscription_change_history
-- Login as regular user and run:
-- SELECT * FROM subscription_change_history LIMIT 5;
-- Expected: Should return no records (empty result)

-- ✅ Test 3: Existing functionality still works
-- Test these operations in the app:
-- - Approve/deny users (superadmin function)
-- - View property status (should auto-update)
-- - Create payment (should distribute to owners)
-- - View tenant user limits
-- Expected: All should work normally

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
-- If something goes wrong, run these commands to revert the changes:
-- ============================================================================

/*
-- Rollback Part 2: Disable RLS on subscription_change_history
ALTER TABLE public.subscription_change_history DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Granada admins can view subscription change history" ON public.subscription_change_history;
DROP POLICY IF EXISTS "Service role can insert change history" ON public.subscription_change_history;
DROP POLICY IF EXISTS "Granada admins can insert change history" ON public.subscription_change_history;
DROP POLICY IF EXISTS "Granada admins can update change history" ON public.subscription_change_history;
DROP POLICY IF EXISTS "Granada admins can delete change history" ON public.subscription_change_history;

-- Rollback Part 1: Remove SET search_path from functions
-- Note: This is typically not necessary unless functions start behaving unexpectedly.
-- To rollback, re-create the functions without the "SET search_path = public" line.
-- The original function definitions can be found in your previous migrations.
*/

-- ============================================================================
-- IMPACT SUMMARY
-- ============================================================================
-- ✅ NO functionality changes - All business logic remains the same
-- ✅ NO data changes - Only adds security protections
-- ✅ NO breaking changes - Existing code continues to work
-- ✅ Edge functions unchanged - Service role key still bypasses RLS
-- ✅ User experience unchanged - No visible changes to end users
-- 
-- Security Improvements:
-- + 9 functions now protected from search_path injection
-- + subscription_change_history now has proper RLS policies
-- + Granada admins have proper audit trail access
-- + Reduced attack surface for privilege escalation
-- ============================================================================

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
