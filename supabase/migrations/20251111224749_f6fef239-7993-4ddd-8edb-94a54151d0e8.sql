-- Drop the restrictive constraint on pms_payments.item
ALTER TABLE pms_payments 
DROP CONSTRAINT IF EXISTS pms_payments_item_check;

-- Add new constraint with all valid item types
ALTER TABLE pms_payments 
ADD CONSTRAINT pms_payments_item_check 
CHECK (
  item IN (
    'A', 
    'B', 
    'UNICO',
    'REEMBOLSO_SERVICIOS',
    'REEMBOLSO_MANTENIMIENTO',
    'REEMBOLSO_MUNICIPAL',
    'REEMBOLSO_EXPENSAS',
    'DEDUCCION_COMISION',
    'DEDUCCION_OTRO'
  )
);