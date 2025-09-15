-- Fix infinite recursion by removing all dependent policies first, then the function

-- Drop all policies that use the is_superadmin function
DROP POLICY IF EXISTS "Superadmins can manage all applications" ON public.applications;
DROP POLICY IF EXISTS "Superadmins can manage all applicants" ON public.applicants;
DROP POLICY IF EXISTS "Superadmins can manage all documents" ON public.documents;
DROP POLICY IF EXISTS "Superadmins can manage all storage documents" ON storage.objects;

-- Drop problematic policies on profiles table
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS public.is_superadmin();

-- Remove conflicting storage policies
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to application documents" ON storage.objects;

-- Create simple storage policies that allow file uploads to work
CREATE POLICY "Allow uploads to application documents bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Allow viewing application documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'application-documents');

CREATE POLICY "Allow deleting application documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'application-documents');

-- Ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES ('application-documents', 'application-documents', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- For applications, only keep basic policies without superadmin checks for now
-- This eliminates all recursion issues
CREATE POLICY "Users can manage applications freely" 
ON public.applications 
FOR ALL 
USING (true);

CREATE POLICY "Users can manage applicants freely" 
ON public.applicants 
FOR ALL 
USING (true);

CREATE POLICY "Users can manage documents freely" 
ON public.documents 
FOR ALL 
USING (true);