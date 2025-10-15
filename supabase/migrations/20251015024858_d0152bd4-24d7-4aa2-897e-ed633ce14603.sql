-- Limpiar datos duplicados del contrato y regenerar correctamente
-- Paso 1: Eliminar items duplicados existentes
DELETE FROM pms_payment_schedule_items 
WHERE contract_id = '5071f4fc-e772-4ff0-a5cf-796c1afbd186';

-- Paso 2: Regenerar con la función corregida
SELECT generate_payment_schedule_items('5071f4fc-e772-4ff0-a5cf-796c1afbd186');