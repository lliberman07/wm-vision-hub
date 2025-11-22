-- Create table for rate limiting password reset attempts
CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  tenant_id TEXT
);

-- Create index for efficient rate limiting queries
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_email 
  ON public.password_reset_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_ip 
  ON public.password_reset_attempts(ip_address, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_tenant 
  ON public.password_reset_attempts(tenant_id, attempted_at DESC);

-- Create table for audit logging
CREATE TABLE IF NOT EXISTS public.password_reset_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id TEXT
);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_user 
  ON public.password_reset_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_email 
  ON public.password_reset_audit_log(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_requested_by 
  ON public.password_reset_audit_log(requested_by, created_at DESC);

-- Enable RLS
ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view these tables
CREATE POLICY "Only service role can access password_reset_attempts"
  ON public.password_reset_attempts
  FOR ALL
  USING (false);

CREATE POLICY "Only service role can access password_reset_audit_log"
  ON public.password_reset_audit_log
  FOR ALL
  USING (false);

-- Function to clean old attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_password_reset_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.password_reset_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION public.cleanup_old_password_reset_attempts() TO service_role;