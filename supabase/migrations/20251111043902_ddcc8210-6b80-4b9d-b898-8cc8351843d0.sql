-- Corregir moneda del contrato LAMB1140
UPDATE pms_contracts 
SET currency = 'USD' 
WHERE contract_number = 'LAMB1140';