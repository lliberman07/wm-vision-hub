-- =====================================================
-- CONFIGURACIÓN AUTOMÁTICA DE CRON JOBS
-- =====================================================
-- Esta migración configura todos los cron jobs necesarios
-- para el sistema PMS y Granada Platform de forma automática
-- =====================================================

-- Habilitar extensiones necesarias (si no están habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Función auxiliar para eliminar cron job si existe
CREATE OR REPLACE FUNCTION safe_unschedule_cron(job_name text)
RETURNS void AS $$
BEGIN
  PERFORM cron.unschedule(job_name);
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorar error si el job no existe
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Eliminar cron jobs existentes para evitar duplicados
SELECT safe_unschedule_cron('sync-exchange-rates-daily');
SELECT safe_unschedule_cron('send-payment-reminders-daily');
SELECT safe_unschedule_cron('send-overdue-alerts-daily');
SELECT safe_unschedule_cron('send-staff-overdue-alerts-daily');
SELECT safe_unschedule_cron('convert-expired-trials');
SELECT safe_unschedule_cron('generate-renewal-invoices');
SELECT safe_unschedule_cron('send-trial-reminders');

-- =====================================================
-- CRON JOBS PMS - PAGOS Y TIPOS DE CAMBIO
-- =====================================================

-- 0️⃣ SINCRONIZACIÓN DE TIPOS DE CAMBIO
-- Ejecuta diariamente a las 18:00 hs Argentina (21:00 UTC)
SELECT cron.schedule(
  'sync-exchange-rates-daily',
  '0 21 * * *',
  $$
  SELECT
    net.http_post(
    url:='https://jrzeabjpxkhccopxfwqa.supabase.co/functions/v1/sync-exchange-rates',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemVhYmpweGtoY2NvcHhmd3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDI0NjksImV4cCI6MjA3MzI3ODQ2OX0.UUIntagLOquAdC6iURCVgqIyKcaHqvtABmh_NBtFD7Y"}'::jsonb,
    body:=concat('{"triggered_at": "', now(), '"}')::jsonb,
        timeout_milliseconds:=30000
    ) as request_id;
  $$
);

-- 1️⃣ RECORDATORIOS PREVIOS AL VENCIMIENTO
-- Ejecuta diariamente a las 9:00 AM
SELECT cron.schedule(
  'send-payment-reminders-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
    url:='https://jrzeabjpxkhccopxfwqa.supabase.co/functions/v1/send-payment-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemVhYmpweGtoY2NvcHhmd3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDI0NjksImV4cCI6MjA3MzI3ODQ2OX0.UUIntagLOquAdC6iURCVgqIyKcaHqvtABmh_NBtFD7Y"}'::jsonb,
    body:=concat('{"triggered_at": "', now(), '"}')::jsonb,
        timeout_milliseconds:=30000
    ) as request_id;
  $$
);

-- 2️⃣ ALERTAS DE PAGOS VENCIDOS (para inquilinos)
-- Ejecuta diariamente a las 12:00 PM
SELECT cron.schedule(
  'send-overdue-alerts-daily',
  '0 12 * * *',
  $$
  SELECT
    net.http_post(
    url:='https://jrzeabjpxkhccopxfwqa.supabase.co/functions/v1/send-payment-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemVhYmpweGtoY2NvcHhmd3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDI0NjksImV4cCI6MjA3MzI3ODQ2OX0.UUIntagLOquAdC6iURCVgqIyKcaHqvtABmh_NBtFD7Y"}'::jsonb,
    body:=concat('{"triggered_at": "', now(), '"}')::jsonb,
        timeout_milliseconds:=30000
    ) as request_id;
  $$
);

-- 3️⃣ ALERTAS AL STAFF (inmobiliaria/administradores)
-- Ejecuta diariamente a las 8:00 AM
SELECT cron.schedule(
  'send-staff-overdue-alerts-daily',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
    url:='https://jrzeabjpxkhccopxfwqa.supabase.co/functions/v1/send-payment-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemVhYmpweGtoY2NvcHhmd3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDI0NjksImV4cCI6MjA3MzI3ODQ2OX0.UUIntagLOquAdC6iURCVgqIyKcaHqvtABmh_NBtFD7Y"}'::jsonb,
    body:=concat('{"triggered_at": "', now(), '"}')::jsonb,
        timeout_milliseconds:=30000
    ) as request_id;
  $$
);

-- =====================================================
-- CRON JOBS SUSCRIPCIONES - TRIALS Y FACTURACIÓN
-- =====================================================

-- 4️⃣ CONVERTIR TRIALS EXPIRADOS A ACTIVOS O SUSPENDIDOS
-- Ejecuta diariamente a las 1:00 AM
SELECT cron.schedule(
  'convert-expired-trials',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url:='https://jrzeabjpxkhccopxfwqa.supabase.co/functions/v1/convert-trial-to-paid',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemVhYmpweGtoY2NvcHhmd3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDI0NjksImV4cCI6MjA3MzI3ODQ2OX0.UUIntagLOquAdC6iURCVgqIyKcaHqvtABmh_NBtFD7Y"}'::jsonb,
    body:=concat('{"execution_date": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- 5️⃣ GENERAR FACTURAS DE RENOVACIÓN
-- Ejecuta diariamente a las 2:00 AM
SELECT cron.schedule(
  'generate-renewal-invoices',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://jrzeabjpxkhccopxfwqa.supabase.co/functions/v1/generate-renewal-invoices',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemVhYmpweGtoY2NvcHhmd3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDI0NjksImV4cCI6MjA3MzI3ODQ2OX0.UUIntagLOquAdC6iURCVgqIyKcaHqvtABmh_NBtFD7Y"}'::jsonb,
    body:=concat('{"execution_date": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- 6️⃣ ENVIAR RECORDATORIOS DE TRIAL
-- Ejecuta diariamente a las 10:00 AM
SELECT cron.schedule(
  'send-trial-reminders',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url:='https://jrzeabjpxkhccopxfwqa.supabase.co/functions/v1/send-trial-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyemVhYmpweGtoY2NvcHhmd3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDI0NjksImV4cCI6MjA3MzI3ODQ2OX0.UUIntagLOquAdC6iURCVgqIyKcaHqvtABmh_NBtFD7Y"}'::jsonb,
    body:=concat('{"execution_date": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- Eliminar función auxiliar
DROP FUNCTION IF EXISTS safe_unschedule_cron(text);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que los cron jobs se crearon correctamente:
-- SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobname;