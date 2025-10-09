-- =====================================================
-- FASE 1: WM ADMIN PROP - PMS FOUNDATION
-- Multi-tenant architecture with independent role system
-- =====================================================

-- 1. Create PMS-specific role enum
CREATE TYPE public.pms_app_role AS ENUM (
  'SUPERADMIN',
  'INMOBILIARIA', 
  'ADMINISTRADOR',
  'PROPIETARIO',
  'INQUILINO'
);

-- 2. Create tenants table (multi-tenant architecture)
CREATE TABLE public.pms_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on tenants
ALTER TABLE public.pms_tenants ENABLE ROW LEVEL SECURITY;

-- 3. Create PMS user roles table (completely independent from general admin roles)
CREATE TABLE public.pms_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.pms_tenants(id) ON DELETE CASCADE NOT NULL,
  role public.pms_app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, tenant_id, role)
);

ALTER TABLE public.pms_user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check PMS roles
CREATE OR REPLACE FUNCTION public.has_pms_role(_user_id UUID, _role public.pms_app_role, _tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pms_user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (_tenant_id IS NULL OR tenant_id = _tenant_id)
  )
$$;

-- 5. Create PMS access requests table
CREATE TABLE public.pms_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.pms_tenants(id) ON DELETE CASCADE NOT NULL,
  requested_role public.pms_app_role NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

ALTER TABLE public.pms_access_requests ENABLE ROW LEVEL SECURITY;

-- 6. Create properties table
CREATE TABLE public.pms_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.pms_tenants(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Argentina',
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'commercial', 'office', 'land', 'warehouse')),
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  surface_total NUMERIC(10,2),
  surface_covered NUMERIC(10,2),
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  amenities TEXT[],
  description TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'inactive')),
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, code)
);

ALTER TABLE public.pms_properties ENABLE ROW LEVEL SECURITY;

-- 7. Create owners table
CREATE TABLE public.pms_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.pms_tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('individual', 'company')),
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  tax_id TEXT,
  bank_account JSONB,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, document_type, document_number)
);

ALTER TABLE public.pms_owners ENABLE ROW LEVEL SECURITY;

-- 8. Create tenants (renters) table
CREATE TABLE public.pms_tenants_renters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.pms_tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_type TEXT NOT NULL CHECK (tenant_type IN ('individual', 'company')),
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  employment_info JSONB,
  emergency_contact JSONB,
  tenant_references JSONB,
  credit_score INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, document_type, document_number)
);

ALTER TABLE public.pms_tenants_renters ENABLE ROW LEVEL SECURITY;

-- 9. Create contracts table
CREATE TABLE public.pms_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.pms_tenants(id) ON DELETE CASCADE NOT NULL,
  contract_number TEXT NOT NULL,
  property_id UUID REFERENCES public.pms_properties(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.pms_owners(id) ON DELETE CASCADE NOT NULL,
  tenant_renter_id UUID REFERENCES public.pms_tenants_renters(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'ARS',
  deposit_amount NUMERIC(12,2),
  payment_day INTEGER CHECK (payment_day BETWEEN 1 AND 31),
  contract_type TEXT CHECK (contract_type IN ('residential', 'commercial', 'temporary')),
  adjustment_type TEXT CHECK (adjustment_type IN ('none', 'annual_index', 'fixed_percentage', 'custom')),
  adjustment_config JSONB,
  guarantors JSONB,
  special_clauses TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated', 'renewed')),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, contract_number)
);

ALTER TABLE public.pms_contracts ENABLE ROW LEVEL SECURITY;

-- 10. Create payments table
CREATE TABLE public.pms_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.pms_tenants(id) ON DELETE CASCADE NOT NULL,
  contract_id UUID REFERENCES public.pms_contracts(id) ON DELETE CASCADE NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('rent', 'deposit', 'expense', 'penalty', 'other')),
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'ARS',
  paid_amount NUMERIC(12,2) DEFAULT 0,
  paid_date DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'check', 'card', 'other')),
  reference_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pms_payments ENABLE ROW LEVEL SECURITY;

-- 11. Create maintenance requests table
CREATE TABLE public.pms_maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.pms_tenants(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.pms_properties(id) ON DELETE CASCADE NOT NULL,
  contract_id UUID REFERENCES public.pms_contracts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('plumbing', 'electrical', 'hvac', 'structural', 'appliance', 'pest_control', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  photos JSONB DEFAULT '[]'::jsonb,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pms_maintenance_requests ENABLE ROW LEVEL SECURITY;

-- 12. Create documents table
CREATE TABLE public.pms_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.pms_tenants(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('property', 'owner', 'tenant', 'contract', 'maintenance')),
  entity_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pms_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Tenants policies
CREATE POLICY "SUPERADMIN can view all tenants"
  ON public.pms_tenants FOR SELECT
  USING (public.has_pms_role(auth.uid(), 'SUPERADMIN'));

CREATE POLICY "Users can view their tenant"
  ON public.pms_tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pms_user_roles
      WHERE user_id = auth.uid() AND tenant_id = pms_tenants.id
    )
  );

CREATE POLICY "SUPERADMIN can manage tenants"
  ON public.pms_tenants FOR ALL
  USING (public.has_pms_role(auth.uid(), 'SUPERADMIN'));

-- PMS User Roles policies
CREATE POLICY "Users can view their own PMS roles"
  ON public.pms_user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "SUPERADMIN can manage all PMS roles"
  ON public.pms_user_roles FOR ALL
  USING (public.has_pms_role(auth.uid(), 'SUPERADMIN'));

-- Access requests policies
CREATE POLICY "Users can create their own access requests"
  ON public.pms_access_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own access requests"
  ON public.pms_access_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "SUPERADMIN can manage all access requests"
  ON public.pms_access_requests FOR ALL
  USING (public.has_pms_role(auth.uid(), 'SUPERADMIN'));

-- Properties policies (tenant-scoped)
CREATE POLICY "PMS users can view properties in their tenant"
  ON public.pms_properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pms_user_roles
      WHERE user_id = auth.uid() AND tenant_id = pms_properties.tenant_id
    )
  );

CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage properties"
  ON public.pms_properties FOR ALL
  USING (
    public.has_pms_role(auth.uid(), 'SUPERADMIN') OR
    public.has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
    public.has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
  );

-- Owners policies
CREATE POLICY "PMS users can view owners in their tenant"
  ON public.pms_owners FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pms_user_roles
      WHERE user_id = auth.uid() AND tenant_id = pms_owners.tenant_id
    )
  );

CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage owners"
  ON public.pms_owners FOR ALL
  USING (
    public.has_pms_role(auth.uid(), 'SUPERADMIN') OR
    public.has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
    public.has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
  );

-- Tenants (renters) policies
CREATE POLICY "PMS users can view tenants in their tenant"
  ON public.pms_tenants_renters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pms_user_roles
      WHERE user_id = auth.uid() AND tenant_id = pms_tenants_renters.tenant_id
    )
  );

CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage tenants"
  ON public.pms_tenants_renters FOR ALL
  USING (
    public.has_pms_role(auth.uid(), 'SUPERADMIN') OR
    public.has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
    public.has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
  );

-- Contracts policies
CREATE POLICY "PMS users can view contracts in their tenant"
  ON public.pms_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pms_user_roles
      WHERE user_id = auth.uid() AND tenant_id = pms_contracts.tenant_id
    )
  );

CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage contracts"
  ON public.pms_contracts FOR ALL
  USING (
    public.has_pms_role(auth.uid(), 'SUPERADMIN') OR
    public.has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
    public.has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
  );

-- Payments policies
CREATE POLICY "PMS users can view payments in their tenant"
  ON public.pms_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pms_user_roles
      WHERE user_id = auth.uid() AND tenant_id = pms_payments.tenant_id
    )
  );

CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage payments"
  ON public.pms_payments FOR ALL
  USING (
    public.has_pms_role(auth.uid(), 'SUPERADMIN') OR
    public.has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
    public.has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
  );

-- Maintenance requests policies
CREATE POLICY "PMS users can view maintenance in their tenant"
  ON public.pms_maintenance_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pms_user_roles
      WHERE user_id = auth.uid() AND tenant_id = pms_maintenance_requests.tenant_id
    )
  );

CREATE POLICY "All PMS users can create maintenance requests"
  ON public.pms_maintenance_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pms_user_roles
      WHERE user_id = auth.uid() AND tenant_id = pms_maintenance_requests.tenant_id
    )
  );

CREATE POLICY "INMOBILIARIA and ADMINISTRADOR can manage maintenance"
  ON public.pms_maintenance_requests FOR UPDATE
  USING (
    public.has_pms_role(auth.uid(), 'SUPERADMIN') OR
    public.has_pms_role(auth.uid(), 'INMOBILIARIA', tenant_id) OR
    public.has_pms_role(auth.uid(), 'ADMINISTRADOR', tenant_id)
  );

-- Documents policies
CREATE POLICY "PMS users can view documents in their tenant"
  ON public.pms_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pms_user_roles
      WHERE user_id = auth.uid() AND tenant_id = pms_documents.tenant_id
    )
  );

CREATE POLICY "PMS users can upload documents"
  ON public.pms_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pms_user_roles
      WHERE user_id = auth.uid() AND tenant_id = pms_documents.tenant_id
    )
  );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_pms_user_roles_user_tenant ON public.pms_user_roles(user_id, tenant_id);
CREATE INDEX idx_pms_user_roles_tenant ON public.pms_user_roles(tenant_id);
CREATE INDEX idx_pms_properties_tenant ON public.pms_properties(tenant_id);
CREATE INDEX idx_pms_properties_status ON public.pms_properties(status);
CREATE INDEX idx_pms_contracts_tenant ON public.pms_contracts(tenant_id);
CREATE INDEX idx_pms_contracts_property ON public.pms_contracts(property_id);
CREATE INDEX idx_pms_contracts_status ON public.pms_contracts(status);
CREATE INDEX idx_pms_payments_contract ON public.pms_payments(contract_id);
CREATE INDEX idx_pms_payments_status ON public.pms_payments(status);
CREATE INDEX idx_pms_payments_due_date ON public.pms_payments(due_date);
CREATE INDEX idx_pms_maintenance_property ON public.pms_maintenance_requests(property_id);
CREATE INDEX idx_pms_maintenance_status ON public.pms_maintenance_requests(status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE TRIGGER update_pms_tenants_updated_at
  BEFORE UPDATE ON public.pms_tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pms_properties_updated_at
  BEFORE UPDATE ON public.pms_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pms_owners_updated_at
  BEFORE UPDATE ON public.pms_owners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pms_tenants_renters_updated_at
  BEFORE UPDATE ON public.pms_tenants_renters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pms_contracts_updated_at
  BEFORE UPDATE ON public.pms_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pms_payments_updated_at
  BEFORE UPDATE ON public.pms_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pms_maintenance_updated_at
  BEFORE UPDATE ON public.pms_maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INITIAL DATA - Create default tenant
-- =====================================================

INSERT INTO public.pms_tenants (name, slug, settings)
VALUES ('WM Property Management', 'wm-default', '{"theme": "default", "features": {"multi_currency": true}}'::jsonb)
ON CONFLICT (slug) DO NOTHING;