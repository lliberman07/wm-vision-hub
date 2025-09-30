-- Update investment_simulations table with profile tracking columns
ALTER TABLE public.investment_simulations
ADD COLUMN IF NOT EXISTS profile_status text DEFAULT 'not_started' CHECK (profile_status IN ('not_started', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS profile_step integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_investment_simulations_profile_status ON public.investment_simulations(profile_status);
CREATE INDEX IF NOT EXISTS idx_investment_simulations_user_email ON public.investment_simulations(user_email);

-- Add trigger to update updated_at on profile status changes
CREATE OR REPLACE FUNCTION update_simulation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_investment_simulations_updated_at ON public.investment_simulations;
CREATE TRIGGER update_investment_simulations_updated_at
BEFORE UPDATE ON public.investment_simulations
FOR EACH ROW
EXECUTE FUNCTION update_simulation_updated_at();