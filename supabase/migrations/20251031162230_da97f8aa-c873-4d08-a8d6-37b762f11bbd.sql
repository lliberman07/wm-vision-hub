-- =====================================================================
-- MIGRACIÓN 2 (CORREGIDA): Crear tabla pms_contract_current
-- =====================================================================

CREATE TABLE IF NOT EXISTS pms_contract_current (
  contract_id uuid PRIMARY KEY REFERENCES pms_contracts(id) ON DELETE CASCADE,
  current_amount numeric NOT NULL,
  current_item_a numeric NULL,
  current_item_b numeric NULL,
  current_from date NOT NULL,
  last_adjustment_date date NULL,
  next_adjustment_date date NOT NULL,
  updated_at timestamptz DEFAULT now(),
  tenant_id uuid NOT NULL REFERENCES pms_tenants(id)
);

-- RLS policies
ALTER TABLE pms_contract_current ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage contract current amounts"
  ON pms_contract_current FOR ALL
  USING (
    has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR 
    has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR 
    has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
  );

CREATE POLICY "Owners can view current amounts of their properties"
  ON pms_contract_current FOR SELECT
  USING (
    has_pms_role(auth.uid(), 'PROPIETARIO'::pms_app_role, tenant_id) AND 
    (
      contract_id IN (
        SELECT c.id FROM pms_contracts c
        JOIN pms_owner_properties op ON op.property_id = c.property_id
        JOIN pms_owners o ON o.id = op.owner_id
        WHERE o.user_id = auth.uid()
          AND (op.end_date IS NULL OR op.end_date >= CURRENT_DATE)
      )
      OR tenant_id IN (
        SELECT tenant_id FROM user_roles 
        WHERE user_id = auth.uid() 
          AND module = 'PMS'::module_type
          AND role::text = 'PROPIETARIO'
          AND status = 'approved'::request_status
      )
    )
  );