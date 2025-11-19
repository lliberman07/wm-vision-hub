-- Revert phases 2 and 3 RLS changes for subscription_requests and subscription_plans

-- Disable RLS on subscription_requests if enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'subscription_requests'
  ) THEN
    ALTER TABLE public.subscription_requests DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Disable RLS on subscription_plans if enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'subscription_plans'
  ) THEN
    ALTER TABLE public.subscription_plans DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop policies created in phases 2 and 3 if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscription_requests' 
      AND policyname = 'granada_admins_can_view_subscription_requests'
  ) THEN
    DROP POLICY "granada_admins_can_view_subscription_requests" ON public.subscription_requests;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscription_requests' 
      AND policyname = 'granada_admins_can_update_subscription_requests'
  ) THEN
    DROP POLICY "granada_admins_can_update_subscription_requests" ON public.subscription_requests;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscription_plans' 
      AND policyname = 'public_can_view_active_plans'
  ) THEN
    DROP POLICY "public_can_view_active_plans" ON public.subscription_plans;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscription_plans' 
      AND policyname = 'granada_admins_manage_plans'
  ) THEN
    DROP POLICY "granada_admins_manage_plans" ON public.subscription_plans;
  END IF;
END $$;