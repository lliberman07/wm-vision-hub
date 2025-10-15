
-- Eliminar el check constraint actual que no incluye 'cancelled'
ALTER TABLE public.pms_contracts
DROP CONSTRAINT IF EXISTS pms_contracts_status_check;

-- Crear nuevo check constraint que incluya 'cancelled'
ALTER TABLE public.pms_contracts
ADD CONSTRAINT pms_contracts_status_check 
CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'expired'::text, 'cancelled'::text, 'terminated'::text, 'renewed'::text]));
