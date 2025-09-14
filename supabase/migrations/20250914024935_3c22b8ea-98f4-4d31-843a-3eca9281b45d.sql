-- Create role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create approval status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'denied');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status public.approval_status NOT NULL DEFAULT 'pending';

-- Add approved_at and denied_at columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS denied_at timestamp with time zone;

-- Remove default from role column and convert to enum
ALTER TABLE public.profiles 
ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.profiles 
ALTER COLUMN role TYPE public.user_role USING role::public.user_role;

-- Set new default for role column
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'admin'::public.user_role;

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (NEW.id, NEW.email, 'admin'::public.user_role, 'pending'::public.approval_status);
  RETURN NEW;
END;
$$;

-- Create function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(role public.user_role, status public.approval_status)
LANGUAGE sql
SECURITY DEFINER
STABLE SET search_path = public
AS $$
  SELECT p.role, p.status
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- Create approve_user function
CREATE OR REPLACE FUNCTION public.approve_user(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if current user is superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Only superadmins can approve users';
  END IF;
  
  UPDATE public.profiles 
  SET status = 'approved'::public.approval_status, 
      approved_at = now(),
      denied_at = NULL
  WHERE id = user_id_param;
END;
$$;

-- Create deny_user function
CREATE OR REPLACE FUNCTION public.deny_user(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if current user is superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Only superadmins can deny users';
  END IF;
  
  UPDATE public.profiles 
  SET status = 'denied'::public.approval_status, 
      denied_at = now(),
      approved_at = NULL
  WHERE id = user_id_param;
END;
$$;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update any profile" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow superadmins to view all profiles
CREATE POLICY "Superadmins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- Allow users to update their own profile (except role and status)
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow superadmins to update any profile
CREATE POLICY "Superadmins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);