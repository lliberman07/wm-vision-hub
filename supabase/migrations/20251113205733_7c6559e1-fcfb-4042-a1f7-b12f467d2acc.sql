-- Drop pms_access_requests table completely
-- This table is no longer needed as subscription flow now works through
-- tenant_subscriptions + pms_client_users

DROP TABLE IF EXISTS public.pms_access_requests CASCADE;