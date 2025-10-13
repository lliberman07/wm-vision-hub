-- Permitir que usuarios no autenticados creen solicitudes de acceso al PMS
-- Primero eliminamos la política restrictiva actual
DROP POLICY IF EXISTS "Users can create their own access requests" ON pms_access_requests;

-- Creamos una nueva política que permite a CUALQUIERA insertar solicitudes
CREATE POLICY "Anyone can create PMS access requests"
ON pms_access_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Aseguramos que la tabla no guarde email en user_id (temporal)
-- sino que podamos almacenar el email del solicitante de alguna forma
-- Por ahora solo permitimos la inserción libre