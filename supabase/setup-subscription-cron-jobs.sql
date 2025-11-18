-- Cron Jobs para Gestión de Suscripciones

-- 1. Convertir trials expirados a activos o suspendidos (diario a las 1 AM)
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

-- 2. Generar facturas de renovación (diario a las 2 AM)
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

-- 3. Enviar recordatorios de trial (diario a las 10 AM)
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

-- Comandos útiles para gestión de cron jobs:

-- Ver todos los cron jobs configurados:
-- SELECT * FROM cron.job;

-- Ver historial de ejecuciones:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Desactivar un job:
-- SELECT cron.unschedule('convert-expired-trials');

-- Ejecutar manualmente un job para testing:
-- SELECT cron.schedule('test-convert-trials', '* * * * *', $$ SELECT convert_expired_trials() $$);
-- SELECT cron.unschedule('test-convert-trials');
