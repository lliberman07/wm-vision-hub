-- Actualizar el tenant wm-default para que sea tipo sistema
UPDATE public.pms_tenants 
SET tenant_type = 'sistema'
WHERE slug = 'wm-default';