-- Fase 1: Agregar campos de tipo de cambio a las tablas de pagos

-- Agregar campos a pms_payments
ALTER TABLE pms_payments 
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18,6) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contract_currency TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS amount_in_contract_currency NUMERIC(18,2) DEFAULT NULL;

COMMENT ON COLUMN pms_payments.exchange_rate IS 'Tipo de cambio aplicado cuando payment currency != contract currency';
COMMENT ON COLUMN pms_payments.contract_currency IS 'Moneda original del contrato para referencia';
COMMENT ON COLUMN pms_payments.amount_in_contract_currency IS 'Monto convertido a la moneda del contrato';

-- Agregar campos a pms_payment_distributions
ALTER TABLE pms_payment_distributions
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18,6) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contract_currency TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS amount_in_contract_currency NUMERIC(18,2) DEFAULT NULL;

-- Agregar campo currency a pms_payment_schedule_items si no existe
ALTER TABLE pms_payment_schedule_items
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ARS';

-- Fase 5: Migración de datos existentes (retrocompatibilidad)
-- Asegurar que todos los contratos tengan moneda
UPDATE pms_contracts
SET currency = 'ARS'
WHERE currency IS NULL;

-- Migrar pagos existentes con currency del contrato
UPDATE pms_payments p
SET 
  currency = COALESCE(p.currency, 'ARS'),
  contract_currency = COALESCE(c.currency, 'ARS')
FROM pms_contracts c
WHERE p.contract_id = c.id
  AND (p.contract_currency IS NULL OR p.currency IS NULL);

-- Migrar distribuciones
UPDATE pms_payment_distributions pd
SET currency = COALESCE(pd.currency, 'ARS')
WHERE pd.currency IS NULL;

-- Migrar schedule items
UPDATE pms_payment_schedule_items si
SET currency = COALESCE(c.currency, 'ARS')
FROM pms_contracts c
WHERE si.contract_id = c.id
  AND si.currency IS NULL;

-- Fase 3: Crear trigger para actualizar distribuciones con moneda
CREATE OR REPLACE FUNCTION update_payment_distributions_with_currency()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar distribuciones asociadas con información de conversión
  UPDATE pms_payment_distributions
  SET 
    contract_currency = NEW.contract_currency,
    amount_in_contract_currency = CASE
      WHEN NEW.exchange_rate IS NOT NULL AND NEW.exchange_rate > 0
      THEN amount / NEW.exchange_rate
      ELSE amount
    END,
    exchange_rate = NEW.exchange_rate
  WHERE payment_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y recrear
DROP TRIGGER IF EXISTS payment_currency_update ON pms_payments;

CREATE TRIGGER payment_currency_update
AFTER INSERT OR UPDATE ON pms_payments
FOR EACH ROW
WHEN (NEW.exchange_rate IS NOT NULL OR NEW.contract_currency IS NOT NULL)
EXECUTE FUNCTION update_payment_distributions_with_currency();

-- Crear índices para mejorar performance en queries de multi-moneda
CREATE INDEX IF NOT EXISTS idx_payments_currency ON pms_payments(currency);
CREATE INDEX IF NOT EXISTS idx_payments_contract_currency ON pms_payments(contract_currency);
CREATE INDEX IF NOT EXISTS idx_distributions_currency ON pms_payment_distributions(currency);