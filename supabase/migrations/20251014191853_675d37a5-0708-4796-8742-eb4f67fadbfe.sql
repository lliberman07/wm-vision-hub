-- Crear tabla para proyecciones mensuales de contratos
CREATE TABLE IF NOT EXISTS pms_contract_monthly_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES pms_contracts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES pms_tenants(id),
  month_number INTEGER NOT NULL,
  period_date DATE NOT NULL,
  item TEXT NOT NULL CHECK (item IN ('A', 'B')),
  base_amount NUMERIC NOT NULL,
  adjustment_applied BOOLEAN DEFAULT false,
  adjustment_percentage NUMERIC DEFAULT 0,
  adjusted_amount NUMERIC NOT NULL,
  indices_used JSONB,
  pending_indices BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, period_date, item)
);

-- Crear índices para mejor performance
CREATE INDEX idx_projections_contract ON pms_contract_monthly_projections(contract_id);
CREATE INDEX idx_projections_period ON pms_contract_monthly_projections(period_date);

-- Habilitar RLS
ALTER TABLE pms_contract_monthly_projections ENABLE ROW LEVEL SECURITY;

-- Política RLS: INMOBILIARIA y ADMINISTRADOR pueden gestionar proyecciones
CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage projections"
ON pms_contract_monthly_projections
FOR ALL
USING (
  has_pms_role(auth.uid(), 'SUPERADMIN'::pms_app_role) OR
  has_pms_role(auth.uid(), 'INMOBILIARIA'::pms_app_role, tenant_id) OR
  has_pms_role(auth.uid(), 'ADMINISTRADOR'::pms_app_role, tenant_id)
);

-- Función para generar proyecciones mensuales de un contrato
CREATE OR REPLACE FUNCTION generate_contract_monthly_projections(contract_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contract_rec RECORD;
  current_month DATE;
  month_count INTEGER := 1;
  monto_a_actual NUMERIC;
  monto_b_actual NUMERIC;
  months_since_first_adjustment INTEGER;
  apply_adjustment BOOLEAN;
  adjustment_months INTEGER;
  total_adjustment_percentage NUMERIC;
  indices_sum NUMERIC;
  indices_array JSONB;
  idx_record RECORD;
  adjustment_start_date DATE;
BEGIN
  -- Obtener datos del contrato
  SELECT * INTO contract_rec
  FROM pms_contracts
  WHERE id = contract_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado';
  END IF;

  -- Eliminar proyecciones existentes
  DELETE FROM pms_contract_monthly_projections WHERE contract_id = contract_id_param;

  -- Determinar cantidad de meses a sumar según frecuencia
  adjustment_months := CASE contract_rec.frecuencia_ajuste
    WHEN 'Trimestral' THEN 3
    WHEN 'Semestral' THEN 6
    WHEN 'Anual' THEN 12
    ELSE 0
  END;

  -- Inicializar montos
  monto_a_actual := COALESCE(contract_rec.monto_a, contract_rec.monthly_rent);
  monto_b_actual := COALESCE(contract_rec.monto_b, 0);

  -- Generar proyección para cada mes del contrato
  current_month := DATE_TRUNC('month', contract_rec.start_date);
  
  WHILE current_month <= contract_rec.end_date LOOP
    apply_adjustment := false;
    total_adjustment_percentage := 0;
    indices_array := '[]'::jsonb;

    -- Verificar si aplica ajuste este mes
    IF contract_rec.fecha_primer_ajuste IS NOT NULL 
       AND contract_rec.indice_ajuste IS NOT NULL 
       AND adjustment_months > 0 THEN
      
      -- Calcular meses desde el primer ajuste
      months_since_first_adjustment := EXTRACT(YEAR FROM AGE(current_month, contract_rec.fecha_primer_ajuste)) * 12 
                                     + EXTRACT(MONTH FROM AGE(current_month, contract_rec.fecha_primer_ajuste));
      
      -- Aplicar ajuste si es el mes de primer ajuste o múltiplo de la frecuencia
      IF months_since_first_adjustment >= 0 AND months_since_first_adjustment % adjustment_months = 0 THEN
        apply_adjustment := true;
        
        -- Obtener índices de los últimos N meses
        indices_sum := 0;
        FOR idx_record IN 
          SELECT period, value 
          FROM pms_economic_indices
          WHERE index_type = contract_rec.indice_ajuste
            AND tenant_id = contract_rec.tenant_id
            AND TO_DATE(period || '-01', 'YYYY-MM-DD') < current_month
            AND TO_DATE(period || '-01', 'YYYY-MM-DD') >= current_month - (adjustment_months || ' months')::INTERVAL
          ORDER BY period ASC
        LOOP
          indices_sum := indices_sum + idx_record.value;
          indices_array := indices_array || jsonb_build_object(
            'period', idx_record.period,
            'value', idx_record.value,
            'type', contract_rec.indice_ajuste
          );
        END LOOP;

        -- Verificar si tenemos todos los índices necesarios
        IF jsonb_array_length(indices_array) = adjustment_months THEN
          total_adjustment_percentage := indices_sum;
          
          -- Calcular nuevos montos con ajuste
          monto_a_actual := monto_a_actual * (1 + total_adjustment_percentage / 100);
          IF monto_b_actual > 0 THEN
            monto_b_actual := monto_b_actual * (1 + total_adjustment_percentage / 100);
          END IF;
        ELSE
          -- Marcar como pendiente de índices
          apply_adjustment := false;
        END IF;
      END IF;
    END IF;

    -- Insertar proyección para Item A
    INSERT INTO pms_contract_monthly_projections (
      contract_id, tenant_id, month_number, period_date, item,
      base_amount, adjustment_applied, adjustment_percentage,
      adjusted_amount, indices_used, pending_indices
    ) VALUES (
      contract_id_param, contract_rec.tenant_id, month_count, current_month, 'A',
      COALESCE(contract_rec.monto_a, contract_rec.monthly_rent),
      apply_adjustment, total_adjustment_percentage,
      monto_a_actual,
      CASE WHEN apply_adjustment THEN 
        jsonb_build_object(
          'applied', true,
          'adjustment_month', TO_CHAR(current_month, 'YYYY-MM'),
          'base_amount', monto_a_actual / (1 + total_adjustment_percentage / 100),
          'indices', indices_array,
          'total_percentage', total_adjustment_percentage,
          'adjusted_amount', monto_a_actual
        )
      ELSE NULL END,
      (apply_adjustment AND jsonb_array_length(indices_array) < adjustment_months)
    );

    -- Insertar proyección para Item B si existe
    IF COALESCE(contract_rec.monto_b, 0) > 0 THEN
      INSERT INTO pms_contract_monthly_projections (
        contract_id, tenant_id, month_number, period_date, item,
        base_amount, adjustment_applied, adjustment_percentage,
        adjusted_amount, indices_used, pending_indices
      ) VALUES (
        contract_id_param, contract_rec.tenant_id, month_count, current_month, 'B',
        contract_rec.monto_b,
        apply_adjustment, total_adjustment_percentage,
        monto_b_actual,
        CASE WHEN apply_adjustment THEN 
          jsonb_build_object(
            'applied', true,
            'adjustment_month', TO_CHAR(current_month, 'YYYY-MM'),
            'base_amount', monto_b_actual / (1 + total_adjustment_percentage / 100),
            'indices', indices_array,
            'total_percentage', total_adjustment_percentage,
            'adjusted_amount', monto_b_actual
          )
        ELSE NULL END,
        (apply_adjustment AND jsonb_array_length(indices_array) < adjustment_months)
      );
    END IF;

    -- Avanzar al siguiente mes
    current_month := current_month + INTERVAL '1 month';
    month_count := month_count + 1;
  END LOOP;
END;
$$;

-- Función para actualizar proyecciones con nuevos índices (se ejecuta diariamente)
CREATE OR REPLACE FUNCTION update_contract_projections_with_indices()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contract_record RECORD;
BEGIN
  -- Para cada contrato activo con ajustes
  FOR contract_record IN 
    SELECT id 
    FROM pms_contracts 
    WHERE status = 'active' 
      AND indice_ajuste IS NOT NULL
      AND fecha_primer_ajuste IS NOT NULL
  LOOP
    -- Regenerar proyecciones
    PERFORM generate_contract_monthly_projections(contract_record.id);
  END LOOP;
END;
$$;

-- Trigger para regenerar proyecciones cuando se actualiza un contrato
CREATE OR REPLACE FUNCTION trigger_regenerate_projections()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Solo regenerar si cambiaron datos relevantes
  IF (NEW.start_date IS DISTINCT FROM OLD.start_date) OR
     (NEW.end_date IS DISTINCT FROM OLD.end_date) OR
     (NEW.monto_a IS DISTINCT FROM OLD.monto_a) OR
     (NEW.monto_b IS DISTINCT FROM OLD.monto_b) OR
     (NEW.fecha_primer_ajuste IS DISTINCT FROM OLD.fecha_primer_ajuste) OR
     (NEW.frecuencia_ajuste IS DISTINCT FROM OLD.frecuencia_ajuste) OR
     (NEW.indice_ajuste IS DISTINCT FROM OLD.indice_ajuste) THEN
    
    PERFORM generate_contract_monthly_projections(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS regenerate_projections_on_contract_update ON pms_contracts;
CREATE TRIGGER regenerate_projections_on_contract_update
AFTER UPDATE ON pms_contracts
FOR EACH ROW
EXECUTE FUNCTION trigger_regenerate_projections();

-- Generar proyecciones para contratos existentes
DO $$
DECLARE
  contract_record RECORD;
BEGIN
  FOR contract_record IN 
    SELECT id FROM pms_contracts WHERE status IN ('active', 'draft')
  LOOP
    PERFORM generate_contract_monthly_projections(contract_record.id);
  END LOOP;
END $$;