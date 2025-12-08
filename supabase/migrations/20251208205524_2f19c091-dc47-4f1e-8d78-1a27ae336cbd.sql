-- Create user_roles entry for INQUILINO user
INSERT INTO user_roles (
  user_id,
  tenant_id,
  role,
  module,
  status,
  approved_at
) VALUES (
  '885a0ae5-12a9-4e6c-8dc5-5e349142a197',
  '8c5b46df-6090-4383-8995-a201ce7e5f9e',
  'INQUILINO',
  'PMS',
  'approved',
  NOW()
)