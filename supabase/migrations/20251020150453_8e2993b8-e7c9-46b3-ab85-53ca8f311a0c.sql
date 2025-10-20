-- Función para verificar si un usuario existe en auth.users por email
CREATE OR REPLACE FUNCTION public.get_user_by_email(email_param text)
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id as user_id, email
  FROM auth.users
  WHERE email = email_param
  LIMIT 1;
$$;