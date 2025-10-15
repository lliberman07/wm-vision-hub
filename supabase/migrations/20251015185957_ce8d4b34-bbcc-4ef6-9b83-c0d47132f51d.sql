-- Agregar constraint única que falta en pms_cashflow_property
-- Esta constraint es necesaria para el ON CONFLICT en el trigger update_property_cashflow_on_expense

ALTER TABLE pms_cashflow_property
ADD CONSTRAINT pms_cashflow_property_unique_key 
UNIQUE (property_id, period, currency);