-- Fix Critical Security Issues: Restrict Public Access to Sensitive Data

-- 1. Fix applications table policies - restrict to owner or admin only
DROP POLICY IF EXISTS "Anyone can create applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications by email" ON applications;
DROP POLICY IF EXISTS "Users can update their own applications by email" ON applications;

CREATE POLICY "Users can create their own applications"
ON applications
FOR INSERT
WITH CHECK (
  email IS NOT NULL AND (
    auth.uid() IS NULL  -- Allow anonymous creation
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can view their own applications"
ON applications
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Users can update their own applications"
ON applications
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- 2. Fix applicants table policies
DROP POLICY IF EXISTS "Users can create applicants for their applications" ON applicants;
DROP POLICY IF EXISTS "Users can view applicants of their applications" ON applicants;
DROP POLICY IF EXISTS "Users can update applicants of their applications" ON applicants;
DROP POLICY IF EXISTS "Users can delete applicants from their applications" ON applicants;

CREATE POLICY "Users can create applicants for their applications"
ON applicants
FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT id FROM applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.uid() IS NULL
  )
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Users can view their own applicants"
ON applicants
FOR SELECT
USING (
  application_id IN (
    SELECT id FROM applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Users can update their own applicants"
ON applicants
FOR UPDATE
USING (
  application_id IN (
    SELECT id FROM applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Users can delete their own applicants"
ON applicants
FOR DELETE
USING (
  application_id IN (
    SELECT id FROM applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- 3. Fix investment_simulations table policies
DROP POLICY IF EXISTS "Anyone can create simulations" ON investment_simulations;
DROP POLICY IF EXISTS "Users can view their own simulations by email" ON investment_simulations;
DROP POLICY IF EXISTS "Users can update their own simulations by email" ON investment_simulations;

CREATE POLICY "Users can create simulations"
ON investment_simulations
FOR INSERT
WITH CHECK (
  user_email IS NOT NULL AND (
    auth.uid() IS NULL  -- Allow anonymous creation
    OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can view their own simulations"
ON investment_simulations
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Users can update their own simulations"
ON investment_simulations
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- 4. Fix knowledge_base table policies - restrict write access
DROP POLICY IF EXISTS "Only admins can insert to knowledge base" ON knowledge_base;
DROP POLICY IF EXISTS "Only admins can update knowledge base" ON knowledge_base;
DROP POLICY IF EXISTS "Only admins can delete from knowledge base" ON knowledge_base;

CREATE POLICY "Only superadmin and WM admin can insert to knowledge base"
ON knowledge_base
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Only superadmin and WM admin can update knowledge base"
ON knowledge_base
FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Only superadmin and WM admin can delete from knowledge base"
ON knowledge_base
FOR DELETE
USING (
  has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

-- 5. Fix storage bucket - make application-documents private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'application-documents';

-- 6. Ensure documents table has proper policies
DROP POLICY IF EXISTS "Users can upload documents to their applications" ON documents;
DROP POLICY IF EXISTS "Users can view documents of their applications" ON documents;
DROP POLICY IF EXISTS "Users can delete documents from their applications" ON documents;

CREATE POLICY "Users can upload documents to their applications"
ON documents
FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT id FROM applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.uid() IS NULL
  )
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
USING (
  application_id IN (
    SELECT id FROM applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);

CREATE POLICY "Users can delete their own documents"
ON documents
FOR DELETE
USING (
  application_id IN (
    SELECT id FROM applications 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR has_role(auth.uid(), 'superadmin'::user_role_type)
  OR has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
);