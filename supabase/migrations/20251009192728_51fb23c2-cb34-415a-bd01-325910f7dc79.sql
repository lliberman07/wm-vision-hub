-- FASE 1: EXTENDER TABLAS EXISTENTES

-- 1.1 Agregar campos a pms_properties
ALTER TABLE pms_properties
ADD COLUMN IF NOT EXISTS alias text,
ADD COLUMN IF NOT EXISTS categoria text,
ADD COLUMN IF NOT EXISTS barrio text,
ADD COLUMN IF NOT EXISTS operacion text CHECK (operacion IN ('Alquiler','Venta','Ambos')),
ADD COLUMN IF NOT EXISTS monto_alquiler numeric,
ADD COLUMN IF NOT EXISTS valor_venta numeric,
ADD COLUMN IF NOT EXISTS estado_publicacion text;

-- 1.2 Agregar campos a pms_contracts
ALTER TABLE pms_contracts
ADD COLUMN IF NOT EXISTS tipo_contrato text CHECK (tipo_contrato IN ('CONTRATO','MIXTO')) DEFAULT 'CONTRATO',
ADD COLUMN IF NOT EXISTS monto_a numeric,
ADD COLUMN IF NOT EXISTS monto_b numeric,
ADD COLUMN IF NOT EXISTS indice_ajuste text,
ADD COLUMN IF NOT EXISTS frecuencia_ajuste text,
ADD COLUMN IF NOT EXISTS frecuencia_factura text DEFAULT 'Mensual',
ADD COLUMN IF NOT EXISTS fecha_primer_ajuste date,
ADD COLUMN IF NOT EXISTS ultimo_ajuste date,
ADD COLUMN IF NOT EXISTS monto_ajustado_actual_a numeric,
ADD COLUMN IF NOT EXISTS monto_ajustado_actual_b numeric,
ADD COLUMN IF NOT EXISTS aplica_a_items text DEFAULT 'A';

-- Migrar datos existentes de monthly_rent a monto_a
UPDATE pms_contracts 
SET monto_a = monthly_rent 
WHERE monto_a IS NULL AND monthly_rent IS NOT NULL;

-- 1.3 Agregar campos a pms_payments
ALTER TABLE pms_payments
ADD COLUMN IF NOT EXISTS item text CHECK (item IN ('A','B','UNICO')) DEFAULT 'UNICO',
ADD COLUMN IF NOT EXISTS porcentaje numeric;

-- FASE 2: CREAR TABLAS NUEVAS

-- 2.1 Tabla pms_owner_properties (MULTI-PROPIETARIO)
CREATE TABLE IF NOT EXISTS pms_owner_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES pms_tenants(id) NOT NULL,
  property_id uuid REFERENCES pms_properties(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES pms_owners(id) ON DELETE CASCADE NOT NULL,
  share_percent numeric CHECK (share_percent > 0 AND share_percent <= 100) NOT NULL,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, owner_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_owner_properties_property ON pms_owner_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_owner_properties_owner ON pms_owner_properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_properties_tenant ON pms_owner_properties(tenant_id);

-- Trigger para validar suma = 100%
CREATE OR REPLACE FUNCTION validate_ownership_shares()
RETURNS TRIGGER AS $$
DECLARE
  total_share numeric;
BEGIN
  SELECT COALESCE(SUM(share_percent), 0) INTO total_share
  FROM pms_owner_properties
  WHERE property_id = NEW.property_id
    AND (end_date IS NULL OR end_date > CURRENT_DATE)
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF total_share + NEW.share_percent > 100 THEN
    RAISE EXCEPTION 'La suma de porcentajes no puede exceder 100 por ciento';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS check_ownership_shares ON pms_owner_properties;
CREATE TRIGGER check_ownership_shares
BEFORE INSERT OR UPDATE ON pms_owner_properties
FOR EACH ROW EXECUTE FUNCTION validate_ownership_shares();

-- RLS para pms_owner_properties
ALTER TABLE pms_owner_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PMS users can view owner_properties in their tenant" ON pms_owner_properties;
CREATE POLICY "PMS users can view owner_properties in their tenant"
ON pms_owner_properties FOR SELECT
USING (EXISTS (
  SELECT 1 FROM pms_user_roles
  WHERE user_id = auth.uid() AND tenant_id = pms_owner_properties.tenant_id
));

DROP POLICY IF EXISTS "INMOBILIARIA and ADMINISTRADOR can manage owner_properties" ON pms_owner_properties;
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage owner_properties"
ON pms_owner_properties FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);

-- 2.2 Tabla pms_payment_distributions
CREATE TABLE IF NOT EXISTS pms_payment_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES pms_tenants(id) NOT NULL,
  payment_id uuid REFERENCES pms_payments(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES pms_owners(id) NOT NULL,
  share_percent numeric NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'ARS',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_distributions_payment ON pms_payment_distributions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_distributions_owner ON pms_payment_distributions(owner_id);
CREATE INDEX IF NOT EXISTS idx_payment_distributions_tenant ON pms_payment_distributions(tenant_id);

ALTER TABLE pms_payment_distributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PMS users can view distributions in their tenant" ON pms_payment_distributions;
CREATE POLICY "PMS users can view distributions in their tenant"
ON pms_payment_distributions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM pms_user_roles
  WHERE user_id = auth.uid() AND tenant_id = pms_payment_distributions.tenant_id
));

-- 2.3 Tabla pms_contract_payment_methods
CREATE TABLE IF NOT EXISTS pms_contract_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES pms_tenants(id) NOT NULL,
  contract_id uuid REFERENCES pms_contracts(id) ON DELETE CASCADE NOT NULL,
  item text CHECK (item IN ('A','B','UNICO')) DEFAULT 'UNICO',
  payment_method text NOT NULL,
  percentage numeric CHECK (percentage > 0 AND percentage <= 100),
  destination_account text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_payment_methods_contract ON pms_contract_payment_methods(contract_id);

ALTER TABLE pms_contract_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PMS users can view payment methods in their tenant" ON pms_contract_payment_methods;
CREATE POLICY "PMS users can view payment methods in their tenant"
ON pms_contract_payment_methods FOR SELECT
USING (EXISTS (
  SELECT 1 FROM pms_user_roles
  WHERE user_id = auth.uid() AND tenant_id = pms_contract_payment_methods.tenant_id
));

DROP POLICY IF EXISTS "INMOBILIARIA and ADMINISTRADOR can manage payment methods" ON pms_contract_payment_methods;
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage payment methods"
ON pms_contract_payment_methods FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);

-- 2.4 Tabla pms_expenses
CREATE TABLE IF NOT EXISTS pms_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES pms_tenants(id) NOT NULL,
  property_id uuid REFERENCES pms_properties(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'ARS',
  expense_date date NOT NULL,
  description text,
  receipt_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_property ON pms_expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON pms_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON pms_expenses(tenant_id);

ALTER TABLE pms_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PMS users can view expenses in their tenant" ON pms_expenses;
CREATE POLICY "PMS users can view expenses in their tenant"
ON pms_expenses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM pms_user_roles
  WHERE user_id = auth.uid() AND tenant_id = pms_expenses.tenant_id
));

DROP POLICY IF EXISTS "INMOBILIARIA and ADMINISTRADOR can manage expenses" ON pms_expenses;
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage expenses"
ON pms_expenses FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);

-- 2.5 Tabla pms_economic_indices
CREATE TABLE IF NOT EXISTS pms_economic_indices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES pms_tenants(id) NOT NULL,
  index_type text NOT NULL CHECK (index_type IN ('IPC','ICL','UVA')),
  period text NOT NULL,
  value numeric NOT NULL,
  source text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, index_type, period)
);

CREATE INDEX IF NOT EXISTS idx_economic_indices_type_period ON pms_economic_indices(index_type, period);
CREATE INDEX IF NOT EXISTS idx_economic_indices_tenant ON pms_economic_indices(tenant_id);

ALTER TABLE pms_economic_indices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PMS users can view indices in their tenant" ON pms_economic_indices;
CREATE POLICY "PMS users can view indices in their tenant"
ON pms_economic_indices FOR SELECT
USING (EXISTS (
  SELECT 1 FROM pms_user_roles
  WHERE user_id = auth.uid() AND tenant_id = pms_economic_indices.tenant_id
));

DROP POLICY IF EXISTS "INMOBILIARIA and SUPERADMIN can manage indices" ON pms_economic_indices;
CREATE POLICY "INMOBILIARIA and SUPERADMIN can manage indices"
ON pms_economic_indices FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id)
);

-- 2.6 Tabla pms_contract_adjustments
CREATE TABLE IF NOT EXISTS pms_contract_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES pms_tenants(id) NOT NULL,
  contract_id uuid REFERENCES pms_contracts(id) ON DELETE CASCADE NOT NULL,
  item text CHECK (item IN ('A','B','UNICO')),
  application_date date NOT NULL,
  index_type text NOT NULL,
  variation_percent numeric NOT NULL,
  previous_amount numeric NOT NULL,
  new_amount numeric NOT NULL,
  audit_json jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_adjustments_contract ON pms_contract_adjustments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_adjustments_date ON pms_contract_adjustments(application_date);

ALTER TABLE pms_contract_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PMS users can view adjustments in their tenant" ON pms_contract_adjustments;
CREATE POLICY "PMS users can view adjustments in their tenant"
ON pms_contract_adjustments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM pms_user_roles
  WHERE user_id = auth.uid() AND tenant_id = pms_contract_adjustments.tenant_id
));

-- 2.7 Tabla pms_cashflow_property
CREATE TABLE IF NOT EXISTS pms_cashflow_property (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES pms_tenants(id) NOT NULL,
  property_id uuid REFERENCES pms_properties(id) ON DELETE CASCADE NOT NULL,
  period text NOT NULL,
  currency text NOT NULL,
  total_income numeric DEFAULT 0,
  total_expenses numeric DEFAULT 0,
  net_result numeric DEFAULT 0,
  detail_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, period, currency)
);

CREATE INDEX IF NOT EXISTS idx_cashflow_property_period ON pms_cashflow_property(property_id, period);
CREATE INDEX IF NOT EXISTS idx_cashflow_currency ON pms_cashflow_property(currency);
CREATE INDEX IF NOT EXISTS idx_cashflow_tenant ON pms_cashflow_property(tenant_id);

ALTER TABLE pms_cashflow_property ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PMS users can view cashflow in their tenant" ON pms_cashflow_property;
CREATE POLICY "PMS users can view cashflow in their tenant"
ON pms_cashflow_property FOR SELECT
USING (EXISTS (
  SELECT 1 FROM pms_user_roles
  WHERE user_id = auth.uid() AND tenant_id = pms_cashflow_property.tenant_id
));