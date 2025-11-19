
-- Reactivar el usuario leolibman@gmail.com en granada_platform_users
UPDATE granada_platform_users
SET is_active = true
WHERE email = 'leolibman@gmail.com';
