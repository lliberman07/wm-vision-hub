-- Agregar columna neighborhood a subscription_requests
ALTER TABLE subscription_requests 
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Actualizar province y city para que sean requeridos (NOT NULL)
-- Primero actualizar valores NULL existentes a vacío
UPDATE subscription_requests 
SET province = '' 
WHERE province IS NULL;

UPDATE subscription_requests 
SET city = '' 
WHERE city IS NULL;

-- Ahora hacer las columnas NOT NULL
ALTER TABLE subscription_requests 
ALTER COLUMN province SET NOT NULL;

ALTER TABLE subscription_requests 
ALTER COLUMN city SET NOT NULL;

-- Agregar comentarios descriptivos
COMMENT ON COLUMN subscription_requests.province IS 'Provincia seleccionada del selector cascada';
COMMENT ON COLUMN subscription_requests.city IS 'Ciudad seleccionada del selector cascada';
COMMENT ON COLUMN subscription_requests.neighborhood IS 'Barrio (opcional) seleccionado del selector cascada';