-- ============================================
-- FASE 1: SISTEMA DE CLONACIÓN DE PROPIEDADES
-- ============================================

-- 1. Agregar columnas para sistema de clonación
ALTER TABLE pms_properties
ADD COLUMN IF NOT EXISTS base_property_code TEXT,
ADD COLUMN IF NOT EXISTS clone_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_clone BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_property_id UUID REFERENCES pms_properties(id);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pms_properties_base_code ON pms_properties(base_property_code);
CREATE INDEX IF NOT EXISTS idx_pms_properties_parent_id ON pms_properties(parent_property_id);
CREATE INDEX IF NOT EXISTS idx_pms_properties_is_clone ON pms_properties(is_clone);

-- 3. RPC: Verificar unicidad de código
CREATE OR REPLACE FUNCTION check_property_code_uniqueness(
  p_code TEXT,
  p_property_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalizar código (trim + uppercase)
  p_code := UPPER(TRIM(p_code));
  
  -- Verificar si existe otro registro con el mismo código
  RETURN NOT EXISTS (
    SELECT 1
    FROM pms_properties
    WHERE UPPER(TRIM(code)) = p_code
      AND (p_property_id IS NULL OR id != p_property_id)
      AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
  );
END;
$$;

-- 4. RPC: Detectar si una propiedad tiene historial de contratos
CREATE OR REPLACE FUNCTION property_has_contract_history(p_property_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pms_contracts
    WHERE property_id = p_property_id
      AND status IN ('active', 'completed', 'cancelled')
    LIMIT 1
  );
END;
$$;

-- 5. RPC: Generar código para propiedad clonada
CREATE OR REPLACE FUNCTION generate_property_clone_code(p_parent_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_code TEXT;
  v_max_suffix INTEGER;
  v_new_code TEXT;
BEGIN
  -- Normalizar código padre
  p_parent_code := UPPER(TRIM(p_parent_code));
  
  -- Extraer código base (sin sufijo -C1, -C2, etc.)
  v_base_code := REGEXP_REPLACE(p_parent_code, '-C\d+$', '');
  
  -- Encontrar el sufijo más alto existente
  SELECT COALESCE(MAX(
    CAST(REGEXP_REPLACE(code, '^.*-C(\d+)$', '\1') AS INTEGER)
  ), 0)
  INTO v_max_suffix
  FROM pms_properties
  WHERE code ~ ('^' || v_base_code || '-C\d+$');
  
  -- Si el padre no tiene sufijo, empezar desde -C1
  IF p_parent_code !~ '-C\d+$' THEN
    v_max_suffix := 0;
  END IF;
  
  -- Generar nuevo código
  v_new_code := v_base_code || '-C' || (v_max_suffix + 1);
  
  RETURN v_new_code;
END;
$$;

-- 6. Comentarios para documentación
COMMENT ON COLUMN pms_properties.base_property_code IS 'Código base de la propiedad original (sin sufijos de clonación)';
COMMENT ON COLUMN pms_properties.clone_count IS 'Número de clones creados a partir de esta propiedad';
COMMENT ON COLUMN pms_properties.is_clone IS 'Indica si esta propiedad es un clon de otra';
COMMENT ON COLUMN pms_properties.parent_property_id IS 'ID de la propiedad padre si es un clon';

COMMENT ON FUNCTION check_property_code_uniqueness IS 'Verifica si un código de propiedad es único en el tenant';
COMMENT ON FUNCTION property_has_contract_history IS 'Detecta si una propiedad tiene contratos (activos, completados o cancelados)';
COMMENT ON FUNCTION generate_property_clone_code IS 'Genera un código único para una propiedad clonada con sufijo -C[N]';