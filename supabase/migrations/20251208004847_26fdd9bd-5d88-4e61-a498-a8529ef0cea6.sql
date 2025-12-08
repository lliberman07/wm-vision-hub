-- Fix applications table RLS to prevent anonymous read access to customer PII
-- This removes the policy that allows unauthenticated users to read applications where user_id IS NULL

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "applications_select_policy" ON applications;

-- Create secure SELECT policy - require authentication for all reads
CREATE POLICY "applications_select_policy" ON applications
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type) OR 
  has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type) OR 
  user_id = auth.uid()
);

-- Update INSERT policy to require authentication (currently allows anon insert which is risky)
DROP POLICY IF EXISTS "applications_insert_policy" ON applications;

CREATE POLICY "applications_insert_policy" ON applications
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() OR 
  user_id IS NULL
);

-- Note: Anonymous application submission is now disabled for security
-- If anonymous submissions are needed, implement a secure session token mechanism