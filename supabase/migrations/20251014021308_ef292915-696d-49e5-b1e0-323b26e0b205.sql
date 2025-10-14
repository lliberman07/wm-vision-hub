-- Agregar nuevas columnas para forma de pago en pms_contracts
ALTER TABLE pms_contracts 
  ADD COLUMN IF NOT EXISTS forma_pago_item_a TEXT DEFAULT 'Efectivo',
  ADD COLUMN IF NOT EXISTS detalle_otro_item_a TEXT,
  ADD COLUMN IF NOT EXISTS forma_pago_item_b TEXT DEFAULT 'Efectivo';

-- Comentario: No eliminamos aplica_a_items por compatibilidad con datos históricos