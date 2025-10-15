-- Paso 1: Corregir la función generate_contract_monthly_projections
-- Eliminamos el filtro erróneo de tenant_id que no existe en pms_economic_indices
CREATE OR REPLACE FUNCTION public.generate_contract_monthly_projections(contract_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        
        -- Obtener índices de los últimos N meses (SIN filtro de tenant_id - CORREGIDO)
        indices_sum := 0;
        FOR idx_record IN 
          SELECT period, value 
          FROM pms_economic_indices
          WHERE index_type = contract_rec.indice_ajuste
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
$function$;

-- Paso 2: Crear función para recalcular proyecciones cuando cambian índices
CREATE OR REPLACE FUNCTION public.recalculate_projections_for_index_type(index_type_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contract_record RECORD;
  affected_count INTEGER := 0;
BEGIN
  -- Buscar todos los contratos activos que usan este tipo de índice
  FOR contract_record IN 
    SELECT id 
    FROM pms_contracts 
    WHERE status = 'active' 
      AND indice_ajuste = index_type_param
      AND fecha_primer_ajuste IS NOT NULL
  LOOP
    -- Regenerar proyecciones para este contrato
    PERFORM generate_contract_monthly_projections(contract_record.id);
    PERFORM generate_payment_schedule_items(contract_record.id);
    affected_count := affected_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Recalculadas proyecciones para % contratos que usan índice %', affected_count, index_type_param;
END;
$function$;

-- Paso 3: Crear trigger para recalcular automáticamente cuando se modifica un índice
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_index_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Recalcular proyecciones para contratos que usen este tipo de índice
  PERFORM recalculate_projections_for_index_type(NEW.index_type);
  RETURN NEW;
END;
$function$;

-- Crear el trigger
DROP TRIGGER IF EXISTS recalculate_projections_on_index_change ON pms_economic_indices;
CREATE TRIGGER recalculate_projections_on_index_change
AFTER INSERT OR UPDATE ON pms_economic_indices
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_on_index_change();

-- Paso 4: Función manual para recalcular todos los contratos (útil para SUPERADMIN)
CREATE OR REPLACE FUNCTION public.recalculate_all_active_contracts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contract_record RECORD;
  affected_count INTEGER := 0;
BEGIN
  -- Buscar todos los contratos activos con ajustes configurados
  FOR contract_record IN 
    SELECT id 
    FROM pms_contracts 
    WHERE status = 'active' 
      AND indice_ajuste IS NOT NULL
      AND fecha_primer_ajuste IS NOT NULL
  LOOP
    -- Regenerar proyecciones
    PERFORM generate_contract_monthly_projections(contract_record.id);
    PERFORM generate_payment_schedule_items(contract_record.id);
    affected_count := affected_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Recalculadas proyecciones para % contratos activos', affected_count;
END;
$function$;