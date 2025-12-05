-- Agregar columna subscription_code a tenant_subscriptions
ALTER TABLE tenant_subscriptions 
ADD COLUMN IF NOT EXISTS subscription_code TEXT UNIQUE;

-- Crear función para generar código de suscripción único
CREATE OR REPLACE FUNCTION generate_subscription_code()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(subscription_code FROM 10) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM tenant_subscriptions
  WHERE subscription_code LIKE 'SUB-' || year_part || '-%';
  
  NEW.subscription_code := 'SUB-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para asignar código automáticamente
DROP TRIGGER IF EXISTS set_subscription_code ON tenant_subscriptions;
CREATE TRIGGER set_subscription_code
BEFORE INSERT ON tenant_subscriptions
FOR EACH ROW
WHEN (NEW.subscription_code IS NULL)
EXECUTE FUNCTION generate_subscription_code();

-- Generar códigos para suscripciones existentes que no tienen código
WITH numbered AS (
  SELECT id, created_at,
    ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at) as rn,
    EXTRACT(YEAR FROM created_at) as year_part
  FROM tenant_subscriptions
  WHERE subscription_code IS NULL
)
UPDATE tenant_subscriptions ts
SET subscription_code = 'SUB-' || n.year_part::TEXT || '-' || LPAD(n.rn::TEXT, 5, '0')
FROM numbered n
WHERE ts.id = n.id;