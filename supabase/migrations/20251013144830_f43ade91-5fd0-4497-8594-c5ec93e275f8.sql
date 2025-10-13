-- Arreglar la tabla pms_access_requests para permitir solicitudes sin usuario autenticado
-- El user_id debe ser nullable y sin foreign key constraint para usuarios nuevos

-- Primero eliminamos el foreign key constraint si existe
ALTER TABLE pms_access_requests 
DROP CONSTRAINT IF EXISTS pms_access_requests_user_id_fkey;

-- Hacemos el user_id nullable
ALTER TABLE pms_access_requests 
ALTER COLUMN user_id DROP NOT NULL;

-- Comentario: Ahora pms_access_requests puede almacenar solicitudes de usuarios
-- que aún no tienen cuenta en auth.users. El user_id será NULL para solicitudes
-- de nuevos usuarios que aún no están en el sistema.