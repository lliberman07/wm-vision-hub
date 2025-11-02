-- =====================================================
-- FUNCIÓN: Validar si un índice puede editarse
-- =====================================================
CREATE OR REPLACE FUNCTION can_edit_economic_index(
  index_period TEXT,
  current_date_param DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  period_date DATE;
  cutoff_date DATE;
BEGIN
  -- Convertir período a fecha
  IF index_period ~ '^\d{4}-\d{2}-\d{2}$' THEN
    -- Formato diario (ICL): YYYY-MM-DD
    period_date := index_period::DATE;
  ELSIF index_period ~ '^\d{4}-\d{2}$' THEN
    -- Formato mensual (IPC/UVA): YYYY-MM
    period_date := (index_period || '-01')::DATE;
  ELSE
    RAISE EXCEPTION 'Formato de período inválido: %', index_period;
  END IF;
  
  -- Calcular fecha límite: primer día del mes P+2
  cutoff_date := DATE_TRUNC('month', period_date + INTERVAL '2 months')::DATE;
  
  -- Permitir edición solo si estamos antes de P+2
  RETURN current_date_param < cutoff_date;
END;
$$;

-- =====================================================
-- FUNCIÓN DEL TRIGGER: Validar ventana de edición
-- =====================================================
CREATE OR REPLACE FUNCTION validate_index_edit_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo validar en UPDATE (INSERT siempre permitido)
  IF TG_OP = 'UPDATE' THEN
    -- Verificar ventana temporal
    IF NOT can_edit_economic_index(NEW.period, CURRENT_DATE) THEN
      RAISE EXCEPTION 'No se puede modificar el índice % de %. Los índices solo pueden editarse durante el mes del período y el mes siguiente.',
        NEW.index_type, NEW.period
        USING HINT = 'Para corregir este índice, elimínelo y vuelva a crearlo con el valor correcto.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER: Aplicar validación antes de UPDATE
-- =====================================================
DROP TRIGGER IF EXISTS validate_index_edit_window_trigger ON pms_economic_indices;

CREATE TRIGGER validate_index_edit_window_trigger
BEFORE UPDATE ON pms_economic_indices
FOR EACH ROW
EXECUTE FUNCTION validate_index_edit_window();

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON FUNCTION can_edit_economic_index IS 
'Valida si un índice económico puede editarse según su período. 
Retorna TRUE si la fecha actual es anterior al primer día del mes P+2.';

COMMENT ON FUNCTION validate_index_edit_window IS 
'Trigger que bloquea modificaciones de índices fuera de su ventana de edición (P y P+1).';