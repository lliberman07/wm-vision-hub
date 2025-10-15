
-- Eliminar el check constraint actual
ALTER TABLE public.pms_contract_adjustments
DROP CONSTRAINT IF EXISTS pms_contract_adjustments_item_check;

-- Crear nuevo check constraint que incluya 'CANCELACION' y 'EXTENSION' para auditoría
ALTER TABLE public.pms_contract_adjustments
ADD CONSTRAINT pms_contract_adjustments_item_check 
CHECK (item = ANY (ARRAY['A'::text, 'B'::text, 'UNICO'::text, 'CANCELACION'::text, 'EXTENSION'::text]));
