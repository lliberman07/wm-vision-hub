-- Actualizar trigger handle_new_user para crear rol admin en WM automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insertar usuario en tabla users
  INSERT INTO public.users (id, email, email_verified, entity_type, first_name, last_name, company_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE((NEW.raw_user_meta_data->>'entity_type')::entity_type, 'persona'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'company_name'
  );
  
  -- Crear rol admin en módulo WM con estado pending
  INSERT INTO public.user_roles (user_id, role, module, status)
  VALUES (NEW.id, 'admin'::user_role_type, 'WM'::module_type, 'pending'::request_status);
  
  RETURN NEW;
END;
$$;