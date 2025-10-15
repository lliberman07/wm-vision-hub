-- =====================================================
-- FASE 1: Extensión del Esquema para Gestión de Gastos
-- =====================================================

-- 1.1 Extender tabla pms_expenses con nuevas columnas
ALTER TABLE pms_expenses 
ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES pms_contracts(id),
ADD COLUMN IF NOT EXISTS paid_by text CHECK (paid_by IN ('inquilino', 'propietario', 'inmobiliaria')),
ADD COLUMN IF NOT EXISTS attributable_to text CHECK (attributable_to IN ('propietario', 'inquilino', 'comun')),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deducted')),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deducted_from_payment_id uuid REFERENCES pms_payments(id),
ADD COLUMN IF NOT EXISTS deduction_amount numeric DEFAULT 0;

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_pms_expenses_contract_id ON pms_expenses(contract_id);
CREATE INDEX IF NOT EXISTS idx_pms_expenses_status ON pms_expenses(status);
CREATE INDEX IF NOT EXISTS idx_pms_expenses_paid_by ON pms_expenses(paid_by);

-- =====================================================
-- 1.2 RLS Policies para PROPIETARIO
-- =====================================================

-- Ver propiedades donde tiene participación (casos 1 y 2)
DROP POLICY IF EXISTS "PROPIETARIO can view own properties" ON pms_properties;
CREATE POLICY "PROPIETARIO can view own properties"
ON pms_properties FOR SELECT
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND (
    -- Caso 1: Propietario bajo un tenant (solo lectura)
    EXISTS (
      SELECT 1 FROM pms_owner_properties op
      JOIN pms_owners o ON o.id = op.owner_id
      WHERE op.property_id = pms_properties.id
        AND o.user_id = auth.uid()
        AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
    )
    OR
    -- Caso 2: Propietario como tenant (gestión completa)
    tenant_id IN (
      SELECT tenant_id FROM user_roles
      WHERE user_id = auth.uid()
        AND module = 'PMS'
        AND role::text = 'PROPIETARIO'
        AND status = 'approved'
    )
  )
);

-- Ver contratos de sus propiedades
DROP POLICY IF EXISTS "PROPIETARIO can view contracts of own properties" ON pms_contracts;
CREATE POLICY "PROPIETARIO can view contracts of own properties"
ON pms_contracts FOR SELECT
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND property_id IN (
    SELECT op.property_id 
    FROM pms_owner_properties op
    JOIN pms_owners o ON o.id = op.owner_id
    WHERE o.user_id = auth.uid()
      AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
    UNION
    -- Propietario como tenant ve todas las propiedades de su tenant
    SELECT id FROM pms_properties
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_roles
      WHERE user_id = auth.uid()
        AND module = 'PMS'
        AND role::text = 'PROPIETARIO'
        AND status = 'approved'
    )
  )
);

-- Ver gastos de sus propiedades
DROP POLICY IF EXISTS "PROPIETARIO can view expenses of own properties" ON pms_expenses;
CREATE POLICY "PROPIETARIO can view expenses of own properties"
ON pms_expenses FOR SELECT
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND property_id IN (
    SELECT op.property_id 
    FROM pms_owner_properties op
    JOIN pms_owners o ON o.id = op.owner_id
    WHERE o.user_id = auth.uid()
    UNION
    SELECT id FROM pms_properties
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_roles
      WHERE user_id = auth.uid()
        AND module = 'PMS'
        AND role::text = 'PROPIETARIO'
        AND status = 'approved'
    )
  )
);

-- Aprobar/rechazar gastos de inquilinos (solo propietario como tenant)
DROP POLICY IF EXISTS "PROPIETARIO as tenant can manage expense approvals" ON pms_expenses;
CREATE POLICY "PROPIETARIO as tenant can manage expense approvals"
ON pms_expenses FOR UPDATE
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND paid_by = 'inquilino'
  AND status IN ('pending', 'deducted')
  AND tenant_id IN (
    SELECT tenant_id FROM user_roles
    WHERE user_id = auth.uid()
      AND module = 'PMS'
      AND role::text = 'PROPIETARIO'
      AND status = 'approved'
  )
);

-- Crear propiedades en su tenant (caso 2)
DROP POLICY IF EXISTS "PROPIETARIO as tenant can create properties" ON pms_properties;
CREATE POLICY "PROPIETARIO as tenant can create properties"
ON pms_properties FOR INSERT
WITH CHECK (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND tenant_id IN (
    SELECT t.id FROM pms_tenants t
    JOIN user_roles ur ON ur.tenant_id = t.id
    WHERE ur.user_id = auth.uid()
      AND ur.module = 'PMS'
      AND ur.role::text = 'PROPIETARIO'
      AND t.tenant_type = 'propietario'
  )
);

-- Editar propiedades de su tenant (caso 2)
DROP POLICY IF EXISTS "PROPIETARIO as tenant can update properties" ON pms_properties;
CREATE POLICY "PROPIETARIO as tenant can update properties"
ON pms_properties FOR UPDATE
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND tenant_id IN (
    SELECT tenant_id FROM user_roles
    WHERE user_id = auth.uid()
      AND module = 'PMS'
      AND role::text = 'PROPIETARIO'
      AND status = 'approved'
  )
);

-- Gestionar contratos en su tenant (caso 2)
DROP POLICY IF EXISTS "PROPIETARIO as tenant can manage contracts" ON pms_contracts;
CREATE POLICY "PROPIETARIO as tenant can manage contracts"
ON pms_contracts FOR ALL
USING (
  has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id)
  AND tenant_id IN (
    SELECT tenant_id FROM user_roles
    WHERE user_id = auth.uid()
      AND module = 'PMS'
      AND role::text = 'PROPIETARIO'
  )
);

-- =====================================================
-- 1.3 RLS Policies para INQUILINO
-- =====================================================

-- Ver solo su contrato activo
DROP POLICY IF EXISTS "INQUILINO can view own active contract" ON pms_contracts;
CREATE POLICY "INQUILINO can view own active contract"
ON pms_contracts FOR SELECT
USING (
  has_pms_role(auth.uid(), 'INQUILINO'::pms_app_role, tenant_id)
  AND tenant_renter_id IN (
    SELECT id FROM pms_tenants_renters WHERE user_id = auth.uid()
  )
  AND status = 'active'
  AND start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE
);

-- Ver propiedad de su contrato activo
DROP POLICY IF EXISTS "INQUILINO can view own rented property" ON pms_properties;
CREATE POLICY "INQUILINO can view own rented property"
ON pms_properties FOR SELECT
USING (
  has_pms_role(auth.uid(), 'INQUILINO'::pms_app_role, tenant_id)
  AND id IN (
    SELECT property_id FROM pms_contracts c
    JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
    WHERE tr.user_id = auth.uid()
      AND c.status = 'active'
      AND c.start_date <= CURRENT_DATE
      AND c.end_date >= CURRENT_DATE
  )
);

-- Ver calendario de pagos de su contrato
DROP POLICY IF EXISTS "INQUILINO can view own payment schedule" ON pms_payment_schedule_items;
CREATE POLICY "INQUILINO can view own payment schedule"
ON pms_payment_schedule_items FOR SELECT
USING (
  has_pms_role(auth.uid(), 'INQUILINO'::pms_app_role, tenant_id)
  AND contract_id IN (
    SELECT c.id FROM pms_contracts c
    JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
    WHERE tr.user_id = auth.uid()
      AND c.status = 'active'
  )
);

-- Crear gastos en su contrato
DROP POLICY IF EXISTS "INQUILINO can create expenses for own contract" ON pms_expenses;
CREATE POLICY "INQUILINO can create expenses for own contract"
ON pms_expenses FOR INSERT
WITH CHECK (
  has_pms_role(auth.uid(), 'INQUILINO'::pms_app_role, tenant_id)
  AND contract_id IN (
    SELECT c.id FROM pms_contracts c
    JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
    WHERE tr.user_id = auth.uid()
      AND c.status = 'active'
  )
  AND paid_by = 'inquilino'
);

-- Ver gastos de su contrato
DROP POLICY IF EXISTS "INQUILINO can view own contract expenses" ON pms_expenses;
CREATE POLICY "INQUILINO can view own contract expenses"
ON pms_expenses FOR SELECT
USING (
  has_pms_role(auth.uid(), 'INQUILINO'::pms_app_role, tenant_id)
  AND contract_id IN (
    SELECT c.id FROM pms_contracts c
    JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
    WHERE tr.user_id = auth.uid()
      AND c.status = 'active'
  )
);

-- =====================================================
-- 1.4 Funciones SQL para Gestión de Gastos
-- =====================================================

-- Función para descontar gastos aprobados de próxima cuota
CREATE OR REPLACE FUNCTION public.deduct_approved_expense_from_next_payment(
  expense_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expense_rec RECORD;
  next_payment_item RECORD;
BEGIN
  -- Obtener gasto aprobado
  SELECT * INTO expense_rec
  FROM pms_expenses
  WHERE id = expense_id_param
    AND status = 'approved'
    AND attributable_to = 'propietario'
    AND paid_by = 'inquilino'
    AND deducted_from_payment_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gasto no encontrado o no es deducible';
  END IF;

  -- Buscar próximo pago pendiente del contrato
  SELECT * INTO next_payment_item
  FROM pms_payment_schedule_items
  WHERE contract_id = expense_rec.contract_id
    AND status = 'pending'
    AND period_date >= CURRENT_DATE
  ORDER BY period_date ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay pagos futuros para descontar';
  END IF;

  -- Reducir el monto esperado del pago
  UPDATE pms_payment_schedule_items
  SET expected_amount = expected_amount - expense_rec.amount,
      updated_at = NOW()
  WHERE id = next_payment_item.id;

  -- Marcar el gasto como deducido
  UPDATE pms_expenses
  SET status = 'deducted',
      deducted_from_payment_id = next_payment_item.id,
      deduction_amount = expense_rec.amount,
      updated_at = NOW()
  WHERE id = expense_id_param;
END;
$$;

-- Función para reversar deducción de gastos
CREATE OR REPLACE FUNCTION public.reverse_expense_deduction(
  expense_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expense_rec RECORD;
BEGIN
  -- Obtener gasto deducido
  SELECT * INTO expense_rec
  FROM pms_expenses
  WHERE id = expense_id_param
    AND status = 'deducted';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gasto no encontrado o no está deducido';
  END IF;

  -- Restaurar monto del pago
  UPDATE pms_payment_schedule_items
  SET expected_amount = expected_amount + expense_rec.deduction_amount,
      updated_at = NOW()
  WHERE id = expense_rec.deducted_from_payment_id;

  -- Marcar gasto como rechazado
  UPDATE pms_expenses
  SET status = 'rejected',
      deducted_from_payment_id = NULL,
      deduction_amount = 0,
      updated_at = NOW()
  WHERE id = expense_id_param;
END;
$$;

-- Función helper para verificar si un contrato está vigente
CREATE OR REPLACE FUNCTION public.is_contract_active(contract_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pms_contracts
    WHERE id = contract_id_param
      AND status = 'active'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE
  )
$$;

-- Función para desactivar inquilinos cuando vence contrato
CREATE OR REPLACE FUNCTION public.deactivate_tenant_on_contract_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_record RECORD;
BEGIN
  -- Buscar contratos que vencieron hoy o antes
  FOR expired_record IN
    SELECT DISTINCT 
      tr.user_id,
      c.tenant_id
    FROM pms_contracts c
    JOIN pms_tenants_renters tr ON tr.id = c.tenant_renter_id
    WHERE c.status = 'active'
      AND c.end_date < CURRENT_DATE
      AND tr.user_id IS NOT NULL
  LOOP
    -- Cambiar status del rol de INQUILINO a 'denied'
    UPDATE user_roles
    SET status = 'denied'
    WHERE user_id = expired_record.user_id
      AND module = 'PMS'
      AND tenant_id = expired_record.tenant_id
      AND role::text = 'INQUILINO';
  END LOOP;
END;
$$;