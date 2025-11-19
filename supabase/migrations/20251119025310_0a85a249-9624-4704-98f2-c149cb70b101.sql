-- Habilitar RLS en subscription_requests si no está habilitado
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

-- Solo crear políticas que no existen
DO $$ 
BEGIN
  -- Política para Granada admins SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_requests' 
    AND policyname = 'Granada admins can view all subscription requests'
  ) THEN
    CREATE POLICY "Granada admins can view all subscription requests"
    ON subscription_requests
    FOR SELECT
    TO authenticated
    USING (is_granada_admin(auth.uid()));
  END IF;

  -- Política para Granada admins UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_requests' 
    AND policyname = 'Granada admins can update subscription requests'
  ) THEN
    CREATE POLICY "Granada admins can update subscription requests"
    ON subscription_requests
    FOR UPDATE
    TO authenticated
    USING (is_granada_admin(auth.uid()))
    WITH CHECK (is_granada_admin(auth.uid()));
  END IF;
END $$;

-- Habilitar RLS en subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Políticas para subscription_plans
DO $$ 
BEGIN
  -- Planes visibles para todos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Anyone can view subscription plans'
  ) THEN
    CREATE POLICY "Anyone can view subscription plans"
    ON subscription_plans
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);
  END IF;

  -- Granada admins pueden gestionar planes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Granada admins can manage subscription plans'
  ) THEN
    CREATE POLICY "Granada admins can manage subscription plans"
    ON subscription_plans
    FOR ALL
    TO authenticated
    USING (is_granada_admin(auth.uid()))
    WITH CHECK (is_granada_admin(auth.uid()));
  END IF;
END $$;