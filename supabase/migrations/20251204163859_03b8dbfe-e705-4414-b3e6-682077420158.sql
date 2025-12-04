-- Eliminar la política problemática que hace subconsulta a auth.users
DROP POLICY IF EXISTS "Users can view their own requests" ON subscription_requests;

-- Crear política corregida usando auth.email() en lugar de subconsulta
CREATE POLICY "Users can view their own requests" 
  ON subscription_requests
  FOR SELECT
  USING (email = auth.email());