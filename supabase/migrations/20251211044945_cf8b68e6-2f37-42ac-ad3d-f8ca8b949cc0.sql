
-- Crear factura manual para Inmobitest S.A.
INSERT INTO subscription_invoices (
  tenant_id,
  subscription_id,
  invoice_number,
  amount,
  subtotal,
  currency,
  status,
  issue_date,
  due_date,
  billing_period_start,
  billing_period_end,
  notes
) VALUES (
  '4757c0f3-f4b5-4a2c-9875-611c5429986e',
  '0f7c5170-6dd8-421d-96d8-79e148ced8f7',
  'INV-INMOBITEST-20251211',
  150000,
  150000,
  'ARS',
  'pending',
  '2025-12-11',
  '2025-12-18',
  '2025-12-11',
  '2026-12-11',
  'Suscripción Plan Básico - Anual'
);
