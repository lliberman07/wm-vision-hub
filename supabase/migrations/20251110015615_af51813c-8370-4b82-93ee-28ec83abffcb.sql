-- Agregar columna expense_id a pms_payment_schedule_items para vincular reembolsos
-- Esto permite rastrear qué schedule items corresponden a gastos reembolsables

ALTER TABLE pms_payment_schedule_items
ADD COLUMN IF NOT EXISTS expense_id uuid REFERENCES pms_expenses(id) ON DELETE SET NULL;

-- Crear índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_schedule_items_expense_id 
ON pms_payment_schedule_items(expense_id) 
WHERE expense_id IS NOT NULL;

COMMENT ON COLUMN pms_payment_schedule_items.expense_id IS 
'Referencia al gasto reembolsable que generó este item de pago. NULL para items regulares.';