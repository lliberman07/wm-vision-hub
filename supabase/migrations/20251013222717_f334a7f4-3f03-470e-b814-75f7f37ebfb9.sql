-- Eliminar la columna owner_id de pms_contracts
-- Esta columna es redundante porque los propietarios ya están definidos en pms_owner_properties
-- Los propietarios se obtienen de: contract → property → owner_properties
-- El trigger de distribución de pagos ya usa pms_owner_properties, no owner_id

ALTER TABLE pms_contracts DROP COLUMN IF EXISTS owner_id;