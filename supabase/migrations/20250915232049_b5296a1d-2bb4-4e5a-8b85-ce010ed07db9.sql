-- Fix infinite recursion in profiles RLS policies
-- First, drop all existing problematic policies on profiles table
DROP POLICY IF EXISTS "Superadmins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies that don't cause infinite recursion
-- For profiles table, we'll use a simpler approach that doesn't reference itself

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to insert their own profile (for new registrations)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create a function to check if user is superadmin without causing recursion
CREATE OR REPLACE FUNCTION auth.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For superadmin access, we'll create a separate policy using the function
-- This avoids the circular reference issue
CREATE POLICY "Superadmins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (auth.is_superadmin())
WITH CHECK (auth.is_superadmin());

-- Now fix the other tables that reference profiles for superadmin checks
-- Drop and recreate policies that reference profiles table

-- Applications table
DROP POLICY IF EXISTS "Superadmins can manage all applications" ON public.applications;
CREATE POLICY "Superadmins can manage all applications" 
ON public.applications 
FOR ALL 
USING (auth.is_superadmin());

-- Applicants table  
DROP POLICY IF EXISTS "Superadmins can manage all applicants" ON public.applicants;
CREATE POLICY "Superadmins can manage all applicants" 
ON public.applicants 
FOR ALL 
USING (auth.is_superadmin());

-- Documents table
DROP POLICY IF EXISTS "Superadmins can manage all documents" ON public.documents;
CREATE POLICY "Superadmins can manage all documents" 
ON public.documents 
FOR ALL 
USING (auth.is_superadmin());

-- Create storage policies for application-documents bucket
-- Allow authenticated users to upload documents
INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES ('application-documents', '.emptyFolderPlaceholder', null, '{}') ON CONFLICT DO NOTHING;

-- Create policies for storage bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'application-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Superadmins can manage all documents in storage"
ON storage.objects
FOR ALL
USING (bucket_id = 'application-documents' AND auth.is_superadmin());

-- Update existing storage bucket to be public for file serving (but with RLS protection)
UPDATE storage.buckets SET public = true WHERE id = 'application-documents';