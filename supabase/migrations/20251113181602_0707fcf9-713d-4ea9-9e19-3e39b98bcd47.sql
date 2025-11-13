-- Create granada_partners table for directory of real estate agencies and independent managers
CREATE TABLE IF NOT EXISTS public.granada_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('real_estate_agency', 'independent_manager')),
  
  -- Location
  province TEXT,
  city TEXT,
  neighborhood TEXT,
  address TEXT,
  
  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Social Media
  instagram TEXT,
  facebook TEXT,
  twitter TEXT,
  tiktok TEXT,
  linkedin TEXT,
  
  -- Status
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.granada_partners ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active partners (public directory)
CREATE POLICY "Partners are viewable by everyone"
  ON public.granada_partners
  FOR SELECT
  USING (is_active = true);

-- Policy: Only Granada admins can insert partners
CREATE POLICY "Only Granada admins can insert partners"
  ON public.granada_partners
  FOR INSERT
  WITH CHECK (is_granada_admin(auth.uid()));

-- Policy: Only Granada admins can update partners
CREATE POLICY "Only Granada admins can update partners"
  ON public.granada_partners
  FOR UPDATE
  USING (is_granada_admin(auth.uid()));

-- Policy: Only Granada admins can delete partners
CREATE POLICY "Only Granada admins can delete partners"
  ON public.granada_partners
  FOR DELETE
  USING (is_granada_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_granada_partners_updated_at
  BEFORE UPDATE ON public.granada_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for search performance
CREATE INDEX idx_granada_partners_name ON public.granada_partners(name);
CREATE INDEX idx_granada_partners_city ON public.granada_partners(city);
CREATE INDEX idx_granada_partners_province ON public.granada_partners(province);
CREATE INDEX idx_granada_partners_type ON public.granada_partners(type);
CREATE INDEX idx_granada_partners_featured ON public.granada_partners(is_featured) WHERE is_featured = true;
