-- Add columns to track reminder emails
ALTER TABLE tenant_subscriptions 
ADD COLUMN IF NOT EXISTS trial_reminder_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS activation_reminder_sent_at timestamptz;

COMMENT ON COLUMN tenant_subscriptions.trial_reminder_sent_at IS 'Timestamp when trial expiration reminder was sent (5 days before end)';
COMMENT ON COLUMN tenant_subscriptions.activation_reminder_sent_at IS 'Timestamp when scheduled activation reminder was sent (7 days before start)';