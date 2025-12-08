-- Fix investment_simulations table RLS to prevent anonymous read access to user emails
-- This removes the condition that allows unauthenticated users to read records where user_id IS NULL

-- Drop the existing SELECT policy that allows anonymous access
DROP POLICY IF EXISTS "investment_simulations_select_policy" ON investment_simulations;

-- Create secure SELECT policy - REQUIRE authentication for all reads
CREATE POLICY "investment_simulations_select_policy" ON investment_simulations
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type) OR 
  user_id = auth.uid() OR
  (user_id IS NULL AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Update INSERT policy to require authentication
DROP POLICY IF EXISTS "investment_simulations_insert_policy" ON investment_simulations;

CREATE POLICY "investment_simulations_insert_policy" ON investment_simulations
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

-- Note: Anonymous simulation creation/viewing is now disabled
-- Users must be authenticated to create or view simulations