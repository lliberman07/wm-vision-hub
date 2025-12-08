-- Drop existing policies
DROP POLICY IF EXISTS "applications_update_policy" ON applications;
DROP POLICY IF EXISTS "applications_delete_policy" ON applications;

-- Recreate UPDATE policy with authenticated role
CREATE POLICY "applications_update_policy" ON applications
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'superadmin'::user_role_type) OR 
    has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type) OR 
    ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))
  );

-- Recreate DELETE policy with authenticated role  
CREATE POLICY "applications_delete_policy" ON applications
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'superadmin'::user_role_type) OR 
    has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
  );