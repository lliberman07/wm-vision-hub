-- Agregar columna submission_id a pms_payments para vincular con payment_submissions
ALTER TABLE pms_payments 
ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES pms_payment_submissions(id);

-- Crear índice para mejorar rendimiento de búsquedas
CREATE INDEX IF NOT EXISTS idx_pms_payments_submission_id ON pms_payments(submission_id);