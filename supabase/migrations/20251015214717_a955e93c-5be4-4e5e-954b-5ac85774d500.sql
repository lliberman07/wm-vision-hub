-- Agregar columnas para rastrear pagos parciales en pms_payment_schedule_items
ALTER TABLE pms_payment_schedule_items 
ADD COLUMN IF NOT EXISTS original_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS accumulated_paid_amount NUMERIC DEFAULT 0;

-- Migrar datos existentes: el monto original es el expected_amount actual
UPDATE pms_payment_schedule_items 
SET original_amount = expected_amount
WHERE original_amount = 0 OR original_amount IS NULL;

-- Para items ya pagados, el accumulated_paid_amount debe ser igual al original_amount
UPDATE pms_payment_schedule_items 
SET accumulated_paid_amount = original_amount
WHERE status = 'paid' AND accumulated_paid_amount = 0;