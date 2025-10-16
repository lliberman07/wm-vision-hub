-- Agregar campos de pago y proveedor a solicitudes de mantenimiento
ALTER TABLE pms_maintenance_requests
ADD COLUMN IF NOT EXISTS paid_by text CHECK (paid_by IN ('inquilino', 'propietario', 'administracion')),
ADD COLUMN IF NOT EXISTS provider_contact text,
ADD COLUMN IF NOT EXISTS provider_phone text;