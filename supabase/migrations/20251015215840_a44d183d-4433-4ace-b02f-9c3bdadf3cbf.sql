-- Agregar campo schedule_item_id a pms_payments para vínculo directo
ALTER TABLE pms_payments 
ADD COLUMN schedule_item_id UUID REFERENCES pms_payment_schedule_items(id);

-- Crear índice para mejorar performance
CREATE INDEX idx_payments_schedule_item ON pms_payments(schedule_item_id);

-- Vincular retroactivamente los pagos existentes usando las notas
UPDATE pms_payments p
SET schedule_item_id = (
  SELECT psi.id 
  FROM pms_payment_schedule_items psi
  WHERE p.notes ILIKE '%[schedule_item:' || psi.id::text || ']%'
  LIMIT 1
)
WHERE p.notes IS NOT NULL 
  AND p.notes LIKE '%[schedule_item:%'
  AND p.schedule_item_id IS NULL;