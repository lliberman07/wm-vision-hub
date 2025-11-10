-- Add SQL to setup cron jobs for subscription management

-- Note: These cron jobs need to be configured in Supabase Dashboard > Database > Cron Jobs
-- Or add to supabase/setup-cron-jobs.sql

-- Cron job 1: Suspend expired trials (runs daily at 00:00)
-- select cron.schedule(
--   'suspend-expired-trials',
--   '0 0 * * *',
--   $$ select net.http_post(
--     url:='https://jrzeabjpxkhccopxfwqa.supabase.co/functions/v1/suspend-expired-trials',
--     headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
--   ); $$
-- );

-- Cron job 2: Send trial reminders (runs daily at 09:00)
-- select cron.schedule(
--   'send-trial-reminders',
--   '0 9 * * *',
--   $$ select net.http_post(
--     url:='https://jrzeabjpxkhccopxfwqa.supabase.co/functions/v1/send-trial-reminders',
--     headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
--   ); $$
-- );

-- For now, just create a comment placeholder for manual setup
COMMENT ON SCHEMA public IS 'Setup cron jobs in Supabase Dashboard for: suspend-expired-trials (daily 00:00) and send-trial-reminders (daily 09:00)';