
-- Eliminar la línea incorrecta del calendario de pagos para octubre 2025
-- Esta línea quedó mal cargada con $80.000 cuando debería ser parte de un esquema diferente
DELETE FROM pms_payment_schedule_items
WHERE id = '4636d207-80a1-48f8-b46e-5699498aa5c1'
  AND period_date = '2025-10-01'
  AND item = 'A'
  AND expected_amount = 80000
  AND status = 'paid';
