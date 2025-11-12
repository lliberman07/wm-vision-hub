-- Setup test CLIENT_ADMIN user with tenant and subscription
DO $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_plan_id uuid;
BEGIN
  -- 1. Get the user_id for clientadmin@test.com
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'clientadmin@test.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User clientadmin@test.com not found in auth.users. Please create the user first in Supabase UI.';
  END IF;

  -- 2. Create test tenant
  INSERT INTO pms_tenants (
    id,
    name,
    slug,
    tenant_type,
    admin_email,
    is_active,
    settings
  ) VALUES (
    gen_random_uuid(),
    'Empresa de Prueba',
    'tenant-prueba',
    'inmobiliaria',
    'contacto@empresadeprueba.com',
    true,
    jsonb_build_object(
      'company_name', 'Empresa de Prueba S.A.',
      'tax_id', '20-12345678-9',
      'address', 'Av. Test 123',
      'city', 'Buenos Aires',
      'state', 'CABA',
      'postal_code', 'C1000',
      'country', 'Argentina',
      'phone', '+54 11 1234-5678'
    )
  ) RETURNING id INTO v_tenant_id;

  -- 3. Create CLIENT_ADMIN user in pms_client_users
  INSERT INTO pms_client_users (
    user_id,
    tenant_id,
    user_type,
    email,
    first_name,
    last_name,
    phone,
    is_active,
    created_at
  ) VALUES (
    v_user_id,
    v_tenant_id,
    'CLIENT_ADMIN',
    'clientadmin@test.com',
    'Admin',
    'Test',
    '+54 11 1234-5678',
    true,
    now()
  );

  -- 4. Check if basic plan exists, if not create it
  SELECT id INTO v_plan_id 
  FROM subscription_plans 
  WHERE slug = 'plan-basico';

  IF v_plan_id IS NULL THEN
    INSERT INTO subscription_plans (
      id,
      name,
      slug,
      description,
      price_monthly,
      price_yearly,
      max_users,
      max_properties,
      max_contracts,
      max_branches,
      features,
      is_active,
      sort_order
    ) VALUES (
      gen_random_uuid(),
      'Plan Básico',
      'plan-basico',
      'Plan básico para pruebas con funcionalidades esenciales',
      5000,
      50000,
      3,
      10,
      10,
      0,
      '{"reports": true, "analytics": false, "api_access": false, "priority_support": false}',
      true,
      1
    ) RETURNING id INTO v_plan_id;
  END IF;

  -- 5. Create active subscription for the tenant (using 'yearly' instead of 'annual')
  INSERT INTO tenant_subscriptions (
    tenant_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    billing_cycle,
    created_at
  ) VALUES (
    v_tenant_id,
    v_plan_id,
    'active',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    'yearly',
    now()
  );

  RAISE NOTICE 'Test setup completed successfully!';
  RAISE NOTICE '  - Tenant ID: %', v_tenant_id;
  RAISE NOTICE '  - User ID: %', v_user_id;
  RAISE NOTICE '  - Plan ID: %', v_plan_id;
  RAISE NOTICE '  - Login: clientadmin@test.com / Test123456';
  
END $$;