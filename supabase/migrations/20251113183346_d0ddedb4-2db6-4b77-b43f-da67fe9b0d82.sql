-- Create initial Granada SUPERADMIN user
-- This migration creates the first superadmin user for Granada Platform

DO $$
DECLARE
  v_user_id UUID;
  v_admin_email TEXT := 'leolibman@gmail.com';
BEGIN
  -- Get user_id from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_admin_email;

  -- If user doesn't exist, raise a notice
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuario con email % no encontrado en auth.users. Debes crear primero el usuario en Supabase Auth.', v_admin_email;
  ELSE
    -- Check if already exists as Granada admin
    IF NOT EXISTS (
      SELECT 1 FROM granada_platform_users 
      WHERE user_id = v_user_id
    ) THEN
      -- Insert as SUPERADMIN
      INSERT INTO granada_platform_users (
        user_id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_by
      ) VALUES (
        v_user_id,
        v_admin_email,
        'Leo',
        'Libman',
        'GRANADA_SUPERADMIN',
        true,
        v_user_id  -- Self-created
      );
      
      RAISE NOTICE 'Usuario SUPERADMIN creado exitosamente para %', v_admin_email;
    ELSE
      RAISE NOTICE 'El usuario % ya existe en granada_platform_users', v_admin_email;
    END IF;
  END IF;
END $$;