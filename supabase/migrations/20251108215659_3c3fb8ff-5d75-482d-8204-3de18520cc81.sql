-- Agregar columnas faltantes a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Actualizar función handle_new_user para sincronizar datos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Primero insertar en users (tabla existente del sistema WM)
  INSERT INTO public.users (id, email, email_verified, entity_type, first_name, last_name, company_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE((NEW.raw_user_meta_data->>'entity_type')::entity_type, 'persona'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    company_name = EXCLUDED.company_name,
    entity_type = EXCLUDED.entity_type,
    updated_at = NOW();
  
  -- Crear rol admin en módulo WM con estado pending
  INSERT INTO public.user_roles (user_id, role, module, status)
  VALUES (NEW.id, 'admin'::user_role_type, 'WM'::module_type, 'pending'::request_status)
  ON CONFLICT (user_id, role, module) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Migrar datos existentes de auth.users
UPDATE public.users u
SET 
  first_name = COALESCE(u.first_name, au.raw_user_meta_data->>'first_name'),
  last_name = COALESCE(u.last_name, au.raw_user_meta_data->>'last_name'),
  company_name = COALESCE(u.company_name, au.raw_user_meta_data->>'company_name')
FROM auth.users au
WHERE u.id = au.id
  AND (
    u.first_name IS NULL OR 
    u.last_name IS NULL OR 
    u.company_name IS NULL
  );