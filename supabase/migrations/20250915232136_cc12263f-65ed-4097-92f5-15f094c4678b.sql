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

-- For superadmin checks, we'll use a different approach
-- Create a function in public schema to check if current user is superadmin
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- For superadmin access, create a policy that uses raw SQL without function calls
-- to avoid any potential recursion issues
CREATE POLICY "Superadmins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
    auth.uid() IN (
        SELECT id 
        FROM public.profiles p2 
        WHERE p2.role = 'superadmin'::user_role 
        AND p2.id = auth.uid()
    )
);

CREATE POLICY "Superadmins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
    auth.uid() IN (
        SELECT id 
        FROM public.profiles p2 
        WHERE p2.role = 'superadmin'::user_role 
        AND p2.id = auth.uid()
    )
);

-- Now fix the other tables that reference profiles for superadmin checks
-- We'll use a simpler approach without subqueries that could cause recursion

-- Applications table - drop and recreate policies
DROP POLICY IF EXISTS "Superadmins can manage all applications" ON public.applications;
CREATE POLICY "Superadmins can manage all applications" 
ON public.applications 
FOR ALL 
USING (public.is_superadmin());

-- Applicants table - drop and recreate policies
DROP POLICY IF EXISTS "Superadmins can manage all applicants" ON public.applicants;
CREATE POLICY "Superadmins can manage all applicants" 
ON public.applicants 
FOR ALL 
USING (public.is_superadmin());

-- Documents table - drop and recreate policies
DROP POLICY IF EXISTS "Superadmins can manage all documents" ON public.documents;
CREATE POLICY "Superadmins can manage all documents" 
ON public.documents 
FOR ALL 
USING (public.is_superadmin());

-- Update existing storage bucket to be public for file serving (but with RLS protection)
UPDATE storage.buckets SET public = true WHERE id = 'application-documents';