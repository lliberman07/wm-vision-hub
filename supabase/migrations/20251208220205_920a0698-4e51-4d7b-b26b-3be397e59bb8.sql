-- Corregir políticas RLS para INQUILINO

-- 1. Eliminar políticas defectuosas existentes
DROP POLICY IF EXISTS "INQUILINO can view own payment schedule" ON pms_payment_schedule_items;
DROP POLICY IF EXISTS "INQUILINO can manage own submissions" ON pms_payment_submissions;

-- 2. Crear política SELECT para pms_payment_schedule_items
CREATE POLICY "INQUILINO can view own payment schedule"
ON pms_payment_schedule_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM pms_client_users cu
    WHERE cu.user_id = auth.uid()
    AND cu.user_type = 'INQUILINO'
    AND cu.contract_id = pms_payment_schedule_items.contract_id
    AND cu.is_active = true
  )
);

-- 3. Crear política INSERT para pms_payment_submissions
CREATE POLICY "INQUILINO can insert submissions"
ON pms_payment_submissions
FOR INSERT
WITH CHECK (
  submitted_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM pms_client_users cu
    WHERE cu.user_id = auth.uid()
    AND cu.user_type = 'INQUILINO'
    AND cu.contract_id = pms_payment_submissions.contract_id
    AND cu.is_active = true
  )
);

-- 4. Crear política SELECT para pms_payment_submissions
CREATE POLICY "INQUILINO can view own submissions"
ON pms_payment_submissions
FOR SELECT
USING (
  submitted_by = auth.uid()
);