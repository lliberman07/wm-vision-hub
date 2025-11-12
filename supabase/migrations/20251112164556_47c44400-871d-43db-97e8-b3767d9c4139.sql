-- 1. Create enum for client types
CREATE TYPE public.pms_client_type AS ENUM ('INMOBILIARIA', 'ADMINISTRADOR_INDEPENDIENTE', 'PROPIETARIO');

-- 2. Create enum for Granada platform roles
CREATE TYPE public.granada_role AS ENUM ('GRANADA_SUPERADMIN', 'GRANADA_ADMIN');

-- 3. Create enum for client user types
CREATE TYPE public.pms_client_user_type AS ENUM ('CLIENT_ADMIN', 'PROPIETARIO', 'INQUILINO');

-- 4. Create granada_platform_users table
CREATE TABLE public.granada_platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role granada_role NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- 5. Add client_type to pms_tenants
ALTER TABLE public.pms_tenants 
ADD COLUMN client_type pms_client_type;

-- 6. Create pms_client_users table (replaces manual user_roles for PMS)
CREATE TABLE public.pms_client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  tenant_id UUID REFERENCES pms_tenants(id) ON DELETE CASCADE NOT NULL,
  user_type pms_client_user_type NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  cuit_cuil TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivated_by UUID REFERENCES auth.users(id),
  -- For INQUILINO type: link to contract
  contract_id UUID REFERENCES pms_contracts(id) ON DELETE SET NULL,
  -- For PROPIETARIO type: link to owner
  owner_id UUID REFERENCES pms_owners(id) ON DELETE SET NULL,
  UNIQUE(user_id, tenant_id, user_type)
);

-- 7. Enable RLS on new tables
ALTER TABLE public.granada_platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_client_users ENABLE ROW LEVEL SECURITY;

-- 8. Create security definer function to check Granada admin status
CREATE OR REPLACE FUNCTION public.is_granada_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM granada_platform_users
    WHERE granada_platform_users.user_id = $1
      AND is_active = true
      AND role IN ('GRANADA_SUPERADMIN', 'GRANADA_ADMIN')
  );
$$;

-- 9. Create security definer function to check Granada superadmin status
CREATE OR REPLACE FUNCTION public.is_granada_superadmin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM granada_platform_users
    WHERE granada_platform_users.user_id = $1
      AND is_active = true
      AND role = 'GRANADA_SUPERADMIN'
  );
$$;

-- 10. Create security definer function to check client admin status
CREATE OR REPLACE FUNCTION public.is_client_admin(user_id UUID, tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pms_client_users
    WHERE pms_client_users.user_id = $1
      AND is_active = true
      AND user_type = 'CLIENT_ADMIN'
      AND (tenant_id IS NULL OR pms_client_users.tenant_id = $2)
  );
$$;

-- 11. RLS Policies for granada_platform_users
CREATE POLICY "Granada admins can view all platform users"
ON granada_platform_users FOR SELECT
USING (is_granada_admin(auth.uid()));

CREATE POLICY "Granada superadmin can manage platform users"
ON granada_platform_users FOR ALL
USING (is_granada_superadmin(auth.uid()));

-- 12. RLS Policies for pms_client_users
CREATE POLICY "Granada admins can view all client users"
ON pms_client_users FOR SELECT
USING (is_granada_admin(auth.uid()));

CREATE POLICY "Granada admins can manage client users"
ON pms_client_users FOR ALL
USING (is_granada_admin(auth.uid()));

CREATE POLICY "Client admins can view users in their tenant"
ON pms_client_users FOR SELECT
USING (is_client_admin(auth.uid(), tenant_id));

CREATE POLICY "Client admins can manage CLIENT_ADMIN users in their tenant"
ON pms_client_users FOR ALL
USING (
  is_client_admin(auth.uid(), tenant_id) 
  AND user_type = 'CLIENT_ADMIN'
);

CREATE POLICY "PROPIETARIO can view their own user record"
ON pms_client_users FOR SELECT
USING (
  user_id = auth.uid() 
  AND user_type = 'PROPIETARIO'
);

CREATE POLICY "INQUILINO can view their own user record"
ON pms_client_users FOR SELECT
USING (
  user_id = auth.uid() 
  AND user_type = 'INQUILINO'
);

-- 13. Create indexes for performance
CREATE INDEX idx_granada_platform_users_user_id ON granada_platform_users(user_id);
CREATE INDEX idx_granada_platform_users_role ON granada_platform_users(role);
CREATE INDEX idx_pms_client_users_user_id ON pms_client_users(user_id);
CREATE INDEX idx_pms_client_users_tenant_id ON pms_client_users(tenant_id);
CREATE INDEX idx_pms_client_users_user_type ON pms_client_users(user_type);
CREATE INDEX idx_pms_client_users_contract_id ON pms_client_users(contract_id);
CREATE INDEX idx_pms_client_users_owner_id ON pms_client_users(owner_id);

-- 14. Create trigger to auto-deactivate INQUILINO when contract ends
CREATE OR REPLACE FUNCTION public.deactivate_inquilino_on_contract_end()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If contract is cancelled or end_date has passed
  IF (NEW.status = 'cancelled' OR NEW.end_date < CURRENT_DATE) 
     AND (OLD.status != 'cancelled' AND OLD.end_date >= CURRENT_DATE) THEN
    UPDATE pms_client_users
    SET is_active = false,
        deactivated_at = now()
    WHERE contract_id = NEW.id
      AND user_type = 'INQUILINO';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deactivate_inquilino_on_contract_end
AFTER UPDATE ON pms_contracts
FOR EACH ROW
EXECUTE FUNCTION deactivate_inquilino_on_contract_end();

-- 15. Add comments for documentation
COMMENT ON TABLE granada_platform_users IS 'Granada platform administrators with system-level access';
COMMENT ON TABLE pms_client_users IS 'Client users: CLIENT_ADMIN (manual), PROPIETARIO (auto-created), INQUILINO (auto-created)';
COMMENT ON COLUMN pms_tenants.client_type IS 'Type of subscriber client: INMOBILIARIA, ADMINISTRADOR_INDEPENDIENTE, or PROPIETARIO';