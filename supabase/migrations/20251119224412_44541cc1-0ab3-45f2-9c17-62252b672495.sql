-- ============================================================
-- RESTRICCIONES PARA PROPIEDADES INACTIVAS
-- ============================================================
-- 
-- Objetivo: Asegurar que las propiedades con status 'inactive' NO puedan:
-- 1. Tener contratos activos o en borrador
-- 2. Tener gastos registrados
--
-- ============================================================

-- ============================================================
-- 1. Trigger: Prevenir activación de contratos en propiedades inactive
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_contract_on_inactive_property()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_status TEXT;
BEGIN
  -- Obtener el estado actual de la propiedad
  SELECT status INTO v_property_status
  FROM pms_properties
  WHERE id = NEW.property_id;
  
  -- Si el contrato está en draft o se está activando
  IF NEW.status IN ('draft', 'active') THEN
    -- Verificar que la propiedad NO esté inactive
    IF v_property_status = 'inactive' THEN
      RAISE EXCEPTION 'No se puede crear o activar un contrato para una propiedad inactiva. Active la propiedad primero.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_contract_on_inactive_property_trigger
BEFORE INSERT OR UPDATE ON pms_contracts
FOR EACH ROW
EXECUTE FUNCTION prevent_contract_on_inactive_property();

-- ============================================================
-- 2. Trigger: Prevenir registro de gastos en propiedades inactive
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_expense_on_inactive_property()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_status TEXT;
BEGIN
  -- Obtener el estado actual de la propiedad
  SELECT status INTO v_property_status
  FROM pms_properties
  WHERE id = NEW.property_id;
  
  -- Verificar que la propiedad NO esté inactive
  IF v_property_status = 'inactive' THEN
    RAISE EXCEPTION 'No se pueden registrar gastos para una propiedad inactiva. Active la propiedad primero para gestionar sus gastos.';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_expense_on_inactive_property_trigger
BEFORE INSERT OR UPDATE ON pms_expenses
FOR EACH ROW
EXECUTE FUNCTION prevent_expense_on_inactive_property();

-- ============================================================
-- 3. Trigger: Prevenir cambio a inactive si hay contratos activos
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_inactive_with_active_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_contract_count INTEGER;
BEGIN
  -- Solo validar si se está intentando cambiar a inactive
  IF NEW.status = 'inactive' AND OLD.status != 'inactive' THEN
    -- Verificar si hay contratos activos
    SELECT COUNT(*) INTO v_active_contract_count
    FROM pms_contracts
    WHERE property_id = NEW.id
      AND status = 'active'
      AND end_date >= CURRENT_DATE;
    
    IF v_active_contract_count > 0 THEN
      RAISE EXCEPTION 'No se puede desactivar la propiedad mientras tenga contratos activos. Cancele los contratos primero.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_inactive_with_active_contract_trigger
BEFORE UPDATE ON pms_properties
FOR EACH ROW
EXECUTE FUNCTION prevent_inactive_with_active_contract();