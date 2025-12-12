-- Fix: La vista IPC calculaba variación entre valores consecutivos,
-- pero los valores ya se cargan como porcentajes directos de inflación mensual.
-- Ahora usa directamente el valor como porcentaje.

CREATE OR REPLACE VIEW pms_index_ipc_monthly AS
SELECT 
  id,
  'IPC'::text as type,
  (period || '-01')::date as period_date,
  value as pct,  -- Usar directamente el valor cargado (ya es el % mensual)
  source,
  created_at as loaded_at
FROM pms_economic_indices
WHERE index_type = 'IPC';