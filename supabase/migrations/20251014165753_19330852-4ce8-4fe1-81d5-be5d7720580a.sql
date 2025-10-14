-- Corregir fechas de contratos afectadas por conversión de timezone
-- Este script agrega 3 días a start_date y end_date para contratos creados 
-- antes de la corrección del bug de timezone

-- Solo corregir contratos con fechas incorrectas (antes de hoy)
UPDATE pms_contracts
SET 
  start_date = start_date + INTERVAL '3 days',
  end_date = end_date + INTERVAL '3 days'
WHERE start_date < CURRENT_DATE
  AND created_at >= '2025-10-01'  -- Solo contratos recientes que fueron afectados
  AND created_at < NOW();  -- Solo contratos ya creados

-- Verificar resultados
SELECT id, contract_number, start_date, end_date, created_at 
FROM pms_contracts 
ORDER BY created_at DESC 
LIMIT 5;