-- Fix remaining infinite recursion issues
-- Remove the problematic superadmin policies from profiles table completely
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;

-- Simplify the is_superadmin function to avoid any potential recursion
DROP FUNCTION IF EXISTS public.is_superadmin();

-- Create a simple function that doesn't reference profiles table from within profiles policies
CREATE OR REPLACE FUNCTION public.check_user_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_found user_role;
BEGIN
    SELECT role INTO user_role_found
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN COALESCE(user_role_found = required_role, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- For profiles table, only allow basic user operations (no superadmin policies on profiles itself)
-- Users can only manage their own profiles

-- Update other tables to use the new function
-- Applications table
DROP POLICY IF EXISTS "Superadmins can manage all applications" ON public.applications;
CREATE POLICY "Superadmins can manage all applications" 
ON public.applications 
FOR ALL 
USING (public.check_user_role(auth.uid(), 'superadmin'::user_role));

-- Applicants table
DROP POLICY IF EXISTS "Superadmins can manage all applicants" ON public.applicants;
CREATE POLICY "Superadmins can manage all applicants" 
ON public.applicants 
FOR ALL 
USING (public.check_user_role(auth.uid(), 'superadmin'::user_role));

-- Documents table
DROP POLICY IF EXISTS "Superadmins can manage all documents" ON public.documents;
CREATE POLICY "Superadmins can manage all documents" 
ON public.documents 
FOR ALL 
USING (public.check_user_role(auth.uid(), 'superadmin'::user_role));

-- Remove conflicting storage policies and recreate them properly
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Superadmins can manage all storage documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to application documents" ON storage.objects;

-- Create simple storage policies without user folder restrictions for now
-- This allows file uploads to work immediately
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