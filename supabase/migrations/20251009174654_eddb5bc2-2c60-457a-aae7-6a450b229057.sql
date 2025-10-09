-- Remove the old duplicate foreign key constraint
ALTER TABLE public.pms_user_roles
DROP CONSTRAINT IF EXISTS pms_user_roles_tenant_id_fkey;