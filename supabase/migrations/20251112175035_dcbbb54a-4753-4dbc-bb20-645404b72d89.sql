-- Add missing unique constraint on user_roles table
-- This constraint is required by the handle_new_user() trigger function
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_module_unique 
ON public.user_roles (user_id, role, module);

-- Add the constraint using the index
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_role_module_unique 
UNIQUE USING INDEX user_roles_user_role_module_unique;