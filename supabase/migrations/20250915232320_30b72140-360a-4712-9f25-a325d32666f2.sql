-- Fix security issue: Function Search Path Mutable
-- Update the is_superadmin function to set search_path for security
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role = 'superadmin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create storage policies for application-documents bucket
-- First ensure we have proper policies for storage operations

-- Allow authenticated users to upload documents to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'application-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own documents  
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'application-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'application-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow superadmins to manage all documents in storage
CREATE POLICY "Superadmins can manage all storage documents"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'application-documents' AND
  public.is_superadmin()
);

-- Allow public uploads to application-documents bucket (needed for anonymous uploads)
-- This will allow file uploads even without authentication, but files will be organized by user
CREATE POLICY "Allow anonymous uploads to application documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'application-documents');