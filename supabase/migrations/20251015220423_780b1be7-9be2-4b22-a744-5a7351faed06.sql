-- Eliminar el check constraint que limita 'item' solo a 'A' o 'B'
-- Esto permite valores como 'A-AJUSTE' y 'B-AJUSTE' para items complementarios
ALTER TABLE pms_payment_schedule_items 
DROP CONSTRAINT IF EXISTS pms_payment_schedule_items_item_check;