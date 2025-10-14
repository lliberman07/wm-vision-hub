-- ============================================
-- FASE 1: Estructura de Base de Datos para Calendario de Pagos
-- ============================================

-- 1. Crear tabla pms_payment_schedule_items
CREATE TABLE IF NOT EXISTS public.pms_payment_schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES pms_contracts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id) ON DELETE CASCADE,
  projection_id UUID NOT NULL REFERENCES pms_contract_monthly_projections(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES pms_owners(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES pms_contract_payment_methods(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  item TEXT NOT NULL CHECK (item IN ('A', 'B')),
  owner_percentage NUMERIC NOT NULL CHECK (owner_percentage > 0 AND owner_percentage <= 100),
  expected_amount NUMERIC NOT NULL CHECK (expected_amount >= 0),
  payment_id UUID REFERENCES pms_payments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX idx_payment_schedule_contract ON pms_payment_schedule_items(contract_id);
CREATE INDEX idx_payment_schedule_period ON pms_payment_schedule_items(period_date);
CREATE INDEX idx_payment_schedule_status ON pms_payment_schedule_items(status);
CREATE INDEX idx_payment_schedule_owner ON pms_payment_schedule_items(owner_id);

-- RLS Policies
ALTER TABLE public.pms_payment_schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage schedule items"
ON public.pms_payment_schedule_items
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN') OR
  has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
);

-- Trigger para updated_at
CREATE TRIGGER update_payment_schedule_items_updated_at
BEFORE UPDATE ON public.pms_payment_schedule_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Crear función para generar items de calendario de pagos
CREATE OR REPLACE FUNCTION public.generate_payment_schedule_items(contract_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  projection_rec RECORD;
  payment_method_rec RECORD;
  calculated_amount NUMERIC;
  item_status TEXT;
BEGIN
  -- Limpiar items existentes del contrato
  DELETE FROM pms_payment_schedule_items WHERE contract_id = contract_id_param;

  -- Iterar sobre todas las proyecciones del contrato
  FOR projection_rec IN
    SELECT * FROM pms_contract_monthly_projections
    WHERE contract_id = contract_id_param
    ORDER BY period_date, item
  LOOP
    -- Para cada proyección, crear un item por cada método de pago (propietario)
    FOR payment_method_rec IN
      SELECT pm.*, o.id as owner_id
      FROM pms_contract_payment_methods pm
      LEFT JOIN pms_owner_properties op ON op.property_id = (
        SELECT property_id FROM pms_contracts WHERE id = contract_id_param
      )
      LEFT JOIN pms_owners o ON o.id = op.owner_id
      WHERE pm.contract_id = contract_id_param
        AND pm.item = projection_rec.item
        AND (op.end_date IS NULL OR op.end_date >= projection_rec.period_date)
        AND pm.percentage > 0
    LOOP
      -- Calcular monto esperado: monto_ajustado × porcentaje
      calculated_amount := projection_rec.adjusted_amount * (payment_method_rec.percentage / 100);

      -- Determinar estado inicial
      IF projection_rec.period_date < CURRENT_DATE THEN
        item_status := 'overdue';
      ELSE
        item_status := 'pending';
      END IF;

      -- Insertar item de calendario
      INSERT INTO pms_payment_schedule_items (
        contract_id,
        tenant_id,
        projection_id,
        owner_id,
        payment_method_id,
        period_date,
        item,
        owner_percentage,
        expected_amount,
        status
      ) VALUES (
        contract_id_param,
        projection_rec.tenant_id,
        projection_rec.id,
        payment_method_rec.owner_id,
        payment_method_rec.id,
        projection_rec.period_date,
        projection_rec.item,
        payment_method_rec.percentage,
        calculated_amount,
        item_status
      );
    END LOOP;
  END LOOP;
END;
$$;

-- 3. Modificar función activate_contract para incluir generación de calendario
CREATE OR REPLACE FUNCTION public.activate_contract(contract_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contract_rec RECORD;
BEGIN
  -- Obtener contrato
  SELECT * INTO contract_rec
  FROM pms_contracts
  WHERE id = contract_id_param
    AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado o no está en borrador';
  END IF;

  -- Validar que no exista otro contrato activo para la propiedad
  IF EXISTS (
    SELECT 1 FROM pms_contracts
    WHERE property_id = contract_rec.property_id
      AND status = 'active'
      AND id != contract_id_param
  ) THEN
    RAISE EXCEPTION 'Ya existe un contrato activo para esta propiedad';
  END IF;

  -- Activar contrato
  UPDATE pms_contracts
  SET status = 'active',
      updated_at = NOW()
  WHERE id = contract_id_param;

  -- Generar proyecciones mensuales
  PERFORM generate_contract_monthly_projections(contract_id_param);

  -- Generar items de calendario de pagos
  PERFORM generate_payment_schedule_items(contract_id_param);

  -- Actualizar estado de propiedad
  UPDATE pms_properties
  SET status = 'rented',
      updated_at = NOW()
  WHERE id = contract_rec.property_id
    AND status != 'maintenance';
END;
$$;

-- 4. Modificar trigger para regenerar calendario cuando cambian proyecciones
CREATE OR REPLACE FUNCTION public.trigger_regenerate_projections()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SOLO regenerar si el contrato está ACTIVO
  IF NEW.status = 'active' AND (
    (NEW.start_date IS DISTINCT FROM OLD.start_date) OR
    (NEW.end_date IS DISTINCT FROM OLD.end_date) OR
    (NEW.monto_a IS DISTINCT FROM OLD.monto_a) OR
    (NEW.monto_b IS DISTINCT FROM OLD.monto_b) OR
    (NEW.fecha_primer_ajuste IS DISTINCT FROM OLD.fecha_primer_ajuste) OR
    (NEW.frecuencia_ajuste IS DISTINCT FROM OLD.frecuencia_ajuste) OR
    (NEW.indice_ajuste IS DISTINCT FROM OLD.indice_ajuste)
  ) THEN
    PERFORM generate_contract_monthly_projections(NEW.id);
    PERFORM generate_payment_schedule_items(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Crear función para actualizar items vencidos
CREATE OR REPLACE FUNCTION public.update_overdue_payment_items()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE pms_payment_schedule_items
  SET status = 'overdue',
      updated_at = NOW()
  WHERE period_date < CURRENT_DATE
    AND status = 'pending';
END;
$$;

-- 6. Crear función para verificar contratos vencidos
CREATE OR REPLACE FUNCTION public.check_expired_contracts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_contract RECORD;
BEGIN
  -- Buscar contratos activos que ya vencieron
  FOR expired_contract IN
    SELECT DISTINCT id, property_id
    FROM pms_contracts
    WHERE status = 'active'
      AND end_date < CURRENT_DATE
  LOOP
    -- Cambiar status del contrato a 'expired'
    UPDATE pms_contracts
    SET status = 'expired',
        updated_at = NOW()
    WHERE id = expired_contract.id;

    -- Actualizar estado de propiedad (respetando mantenimiento manual)
    UPDATE pms_properties
    SET status = get_property_auto_status(expired_contract.property_id),
        updated_at = NOW()
    WHERE id = expired_contract.property_id
      AND status != 'maintenance';
  END LOOP;
END;
$$;