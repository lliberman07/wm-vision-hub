-- Limpiar rol WM conflictivo de leonardoliberman@hotmail.com
-- Este usuario solo debe tener acceso PMS (INMOBILIARIA)
-- El rol WM con status 'denied' estaba bloqueando el acceso de otros usuarios a /admin

DELETE FROM user_roles
WHERE user_id = '0c7f03f6-b165-4928-8beb-9ae3d7767733'
  AND module = 'WM';

-- Verificación: Este usuario ahora SOLO debe tener rol PMS
-- SELECT u.email, ur.role, ur.module, ur.status 
-- FROM auth.users u 
-- JOIN user_roles ur ON ur.user_id = u.id 
-- WHERE u.id = '0c7f03f6-b165-4928-8beb-9ae3d7767733';