-- Corregir fecha_primer_ajuste afectada por conversión de timezone
-- Agregar 3 días a las fechas incorrectas

UPDATE pms_contracts
SET fecha_primer_ajuste = fecha_primer_ajuste + INTERVAL '3 days'
WHERE fecha_primer_ajuste IS NOT NULL
  AND fecha_primer_ajuste < '2025-04-01'
  AND created_at >= '2025-10-01';

-- Verificar resultados
SELECT id, contract_number, fecha_primer_ajuste, start_date, end_date 
FROM pms_contracts 
WHERE fecha_primer_ajuste IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;