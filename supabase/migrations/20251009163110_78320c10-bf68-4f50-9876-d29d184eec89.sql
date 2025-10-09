-- Add foreign key constraint from pms_user_roles to pms_tenants
ALTER TABLE public.pms_user_roles
ADD CONSTRAINT fk_pms_user_roles_tenant
FOREIGN KEY (tenant_id) 
REFERENCES public.pms_tenants(id) 
ON DELETE CASCADE;