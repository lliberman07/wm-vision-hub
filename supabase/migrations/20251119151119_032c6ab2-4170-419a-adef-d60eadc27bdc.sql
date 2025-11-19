
-- Insertar usuario en auth.users para leolibman@gmail.com
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b3d9c2f0-d0e6-445f-9a3c-a00ac16b8868',
  'authenticated',
  'authenticated',
  'leolibman@gmail.com',
  crypt('TempPass123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Leo","last_name":"Libman","role":"GRANADA_SUPERADMIN"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('TempPass123!', gen_salt('bf')),
  email_confirmed_at = NOW(),
  raw_user_meta_data = '{"first_name":"Leo","last_name":"Libman","role":"GRANADA_SUPERADMIN"}',
  updated_at = NOW();
