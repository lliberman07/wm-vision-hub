-- =====================================================
-- CONFIGURACIÓN DE CRON JOBS PARA ALERTAS DE PAGOS
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve al Dashboard de Supabase → Database → Extensions
-- 2. Habilita las extensiones: pg_cron y pg_net
-- 3. Ejecuta este script desde el SQL Editor
-- 
-- IMPORTANTE: Reemplaza los siguientes valores antes de ejecutar:
-- - YOUR_PROJECT_URL: La URL de tu proyecto (ej: https://abc123.supabase.co)
-- - YOUR_ANON_KEY: Tu anon key de Supabase
-- =====================================================

-- 1️⃣ RECORDATORIOS PREVIOS AL VENCIMIENTO
-- Ejecuta diariamente a las 9:00 AM (horario del servidor)
SELECT cron.schedule(
  'send-payment-reminders-daily',
  '0 9 * * *', -- Todos los días a las 9:00 AM
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
-- Ejecuta diariamente a las 12:00 PM (mediodía)
SELECT cron.schedule(
  'send-overdue-alerts-daily',
  '0 12 * * *', -- Todos los días a las 12:00 PM
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
-- Ejecuta diariamente a las 8:00 AM (antes de que empiecen a trabajar)
SELECT cron.schedule(
  'send-staff-overdue-alerts-daily',
  '0 8 * * *', -- Todos los días a las 8:00 AM
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
-- COMANDOS ÚTILES PARA GESTIONAR CRON JOBS
-- =====================================================

-- Ver todos los cron jobs configurados:
-- SELECT jobid, jobname, schedule, command FROM cron.job ORDER BY jobname;

-- Ver historial de ejecuciones (últimas 50):
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;

-- Eliminar un cron job específico:
-- SELECT cron.unschedule('send-payment-reminders-daily');
-- SELECT cron.unschedule('send-overdue-alerts-daily');
-- SELECT cron.unschedule('send-staff-overdue-alerts-daily');

-- Ejecutar manualmente un job para probar (reemplaza jobid):
-- SELECT cron.schedule_in_database('job-name', '* * * * *', $$SELECT 1$$, 'postgres', 'postgres', true);
