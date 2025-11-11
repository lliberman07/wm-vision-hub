-- Crear tabla para almacenar histórico de tipos de cambio
CREATE TABLE pms_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES pms_tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('oficial', 'blue', 'mep', 'manual')),
  buy_rate DECIMAL(10,2),
  sell_rate DECIMAL(10,2) NOT NULL,
  api_response JSONB,
  is_manual BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, date, source_type)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_exchange_rates_tenant_date ON pms_exchange_rates(tenant_id, date DESC);
CREATE INDEX idx_exchange_rates_date ON pms_exchange_rates(date DESC);
CREATE INDEX idx_exchange_rates_source ON pms_exchange_rates(source_type);

-- Habilitar RLS
ALTER TABLE pms_exchange_rates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuarios pueden ver tipos de cambio de su tenant
CREATE POLICY "Users can view their tenant exchange rates"
  ON pms_exchange_rates FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles 
      WHERE user_id = auth.uid() AND module = 'PMS' AND status = 'approved'
    )
  );

-- Políticas RLS: solo admins pueden insertar/actualizar
CREATE POLICY "Admins can manage exchange rates"
  ON pms_exchange_rates FOR ALL
  TO authenticated
  USING (
    has_pms_role(auth.uid(), 'SUPERADMIN') OR
    has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
    has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
  );

-- Agregar configuración de tipo de cambio a tenants
ALTER TABLE pms_tenants 
ADD COLUMN IF NOT EXISTS exchange_rate_source TEXT DEFAULT 'oficial' CHECK (exchange_rate_source IN ('oficial', 'blue', 'mep')),
ADD COLUMN IF NOT EXISTS use_automatic_rates BOOLEAN DEFAULT true;