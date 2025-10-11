-- ==========================================
-- FASE 1: NUEVA ARQUITECTURA DE BASE DE DATOS
-- ==========================================

-- 1.1 Crear nuevos enums
CREATE TYPE public.entity_type AS ENUM ('persona', 'empresa');
CREATE TYPE public.user_role_type AS ENUM ('superadmin', 'admin', 'propietario', 'inquilino', 'inmobiliaria', 'proveedor');
CREATE TYPE public.module_type AS ENUM ('WM', 'PMS');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'denied');

-- 1.2 Crear tabla USERS (reemplaza profiles)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL DEFAULT 'persona',
  first_name text,
  last_name text,
  company_name text,
  email text UNIQUE NOT NULL,
  phone text,
  approved boolean DEFAULT false,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.3 Crear tabla USER_ROLES (reemplaza profiles.role + pms_user_roles)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role user_role_type NOT NULL,
  module module_type NOT NULL,
  tenant_id uuid REFERENCES pms_tenants(id),
  status request_status DEFAULT 'pending',
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Crear índices únicos parciales para user_roles
CREATE UNIQUE INDEX unique_user_role_module_with_tenant 
  ON public.user_roles(user_id, role, module, tenant_id) 
  WHERE tenant_id IS NOT NULL;

CREATE UNIQUE INDEX unique_user_role_module_without_tenant 
  ON public.user_roles(user_id, role, module) 
  WHERE tenant_id IS NULL;

-- 1.4 Crear tabla ACCESS_REQUESTS (reemplaza pms_access_requests)
CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  requested_roles text[] NOT NULL,
  module module_type NOT NULL,
  reason text,
  status request_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 1.5 Crear función de seguridad para chequeo de roles (SECURITY DEFINER para evitar recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id uuid, 
  _role user_role_type,
  _module module_type DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (_module IS NULL OR module = _module)
      AND status = 'approved'
  )
$$;

-- 1.6 Actualizar trigger handle_new_user (solo crea usuario base)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
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
  RETURN NEW;
END;
$$;

-- Reemplazar trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1.7 Crear políticas RLS para tabla users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::user_role_type) OR has_role(auth.uid(), 'admin'::user_role_type));

-- 1.8 Crear políticas RLS para tabla user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all roles"
  ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::user_role_type));

CREATE POLICY "Admins can manage WM roles"
  ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type) AND module = 'WM');

-- 1.9 Crear políticas RLS para tabla access_requests
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON public.access_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own requests"
  ON public.access_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all requests"
  ON public.access_requests FOR ALL
  USING (
    has_role(auth.uid(), 'superadmin'::user_role_type) OR
    has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
  );

-- ==========================================
-- FASE 2: MIGRACIÓN DE DATOS EXISTENTES
-- ==========================================

-- 2.1 Migrar datos de profiles a users (usuarios WM Admin)
INSERT INTO public.users (id, email, entity_type, approved, email_verified, created_at, updated_at)
SELECT 
  p.id,
  p.email,
  'persona'::entity_type,
  CASE WHEN p.status = 'approved' THEN true ELSE false END,
  true,
  p.created_at,
  p.updated_at
FROM public.profiles p
ON CONFLICT (id) DO NOTHING;

-- 2.2 Migrar roles de profiles a user_roles (roles WM)
INSERT INTO public.user_roles (user_id, role, module, status, approved_at, created_at)
SELECT 
  p.id,
  CASE 
    WHEN p.role = 'superadmin' THEN 'superadmin'::user_role_type
    WHEN p.role = 'admin' THEN 'admin'::user_role_type
  END,
  'WM'::module_type,
  CASE 
    WHEN p.status = 'approved' THEN 'approved'::request_status 
    WHEN p.status = 'denied' THEN 'denied'::request_status
    ELSE 'pending'::request_status 
  END,
  p.approved_at,
  p.created_at
FROM public.profiles p
WHERE p.role IN ('superadmin', 'admin');

-- 2.3 Migrar usuarios PMS que no existen en users
INSERT INTO public.users (id, email, entity_type, approved, email_verified, created_at)
SELECT DISTINCT
  ur.user_id,
  au.email,
  'persona'::entity_type,
  true,
  true,
  ur.created_at
FROM pms_user_roles ur
JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN public.users u ON u.id = ur.user_id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2.4 Migrar roles PMS de pms_user_roles a user_roles
INSERT INTO public.user_roles (user_id, role, module, tenant_id, status, created_at)
SELECT 
  pr.user_id,
  CASE 
    WHEN pr.role = 'SUPERADMIN' THEN 'superadmin'::user_role_type
    WHEN pr.role = 'INMOBILIARIA' THEN 'inmobiliaria'::user_role_type
    WHEN pr.role = 'ADMINISTRADOR' THEN 'admin'::user_role_type
    WHEN pr.role = 'PROPIETARIO' THEN 'propietario'::user_role_type
    WHEN pr.role = 'INQUILINO' THEN 'inquilino'::user_role_type
    WHEN pr.role = 'PROVEEDOR' THEN 'proveedor'::user_role_type
  END,
  'PMS'::module_type,
  pr.tenant_id,
  'approved'::request_status,
  pr.created_at
FROM pms_user_roles pr;

-- 2.5 Migrar solicitudes de pms_access_requests a access_requests
INSERT INTO public.access_requests (
  id, user_id, requested_roles, module, reason, status, reviewed_by, reviewed_at, created_at
)
SELECT 
  par.id,
  par.user_id,
  ARRAY[par.requested_role::text],
  'PMS'::module_type,
  par.reason,
  CASE 
    WHEN par.status = 'pending' THEN 'pending'::request_status
    WHEN par.status = 'approved' THEN 'approved'::request_status
    WHEN par.status = 'denied' THEN 'denied'::request_status
  END,
  par.reviewed_by,
  par.reviewed_at,
  par.created_at
FROM pms_access_requests par
ON CONFLICT (id) DO NOTHING;

-- 2.6 Crear índices para optimizar queries
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_module ON public.user_roles(module);
CREATE INDEX idx_user_roles_status ON public.user_roles(status);
CREATE INDEX idx_access_requests_user_id ON public.access_requests(user_id);
CREATE INDEX idx_access_requests_status ON public.access_requests(status);

-- 2.7 Actualizar funciones approve_user y deny_user para usar nuevas tablas
CREATE OR REPLACE FUNCTION public.approve_user(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario actual es superadmin
  IF NOT has_role(auth.uid(), 'superadmin'::user_role_type) THEN
    RAISE EXCEPTION 'Solo superadmins pueden aprobar usuarios';
  END IF;
  
  -- Actualizar user_roles
  UPDATE public.user_roles 
  SET status = 'approved'::request_status, 
      approved_at = now()
  WHERE user_id = user_id_param;
  
  -- Actualizar users
  UPDATE public.users
  SET approved = true
  WHERE id = user_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION public.deny_user(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario actual es superadmin
  IF NOT has_role(auth.uid(), 'superadmin'::user_role_type) THEN
    RAISE EXCEPTION 'Solo superadmins pueden denegar usuarios';
  END IF;
  
  -- Actualizar user_roles
  UPDATE public.user_roles 
  SET status = 'denied'::request_status
  WHERE user_id = user_id_param;
  
  -- Actualizar users
  UPDATE public.users
  SET approved = false
  WHERE id = user_id_param;
END;
$$;