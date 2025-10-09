-- Add additional fields to pms_access_requests table
ALTER TABLE public.pms_access_requests 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN document_id TEXT,
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN postal_code TEXT,
ADD COLUMN company_name TEXT,
ADD COLUMN tax_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.pms_access_requests.first_name IS 'User first name';
COMMENT ON COLUMN public.pms_access_requests.last_name IS 'User last name';
COMMENT ON COLUMN public.pms_access_requests.phone IS 'User phone number';
COMMENT ON COLUMN public.pms_access_requests.document_id IS 'DNI or identification document';
COMMENT ON COLUMN public.pms_access_requests.address IS 'Street address';
COMMENT ON COLUMN public.pms_access_requests.city IS 'City';
COMMENT ON COLUMN public.pms_access_requests.state IS 'Province/State';
COMMENT ON COLUMN public.pms_access_requests.postal_code IS 'Postal code';
COMMENT ON COLUMN public.pms_access_requests.company_name IS 'Company name (for INMOBILIARIA role)';
COMMENT ON COLUMN public.pms_access_requests.tax_id IS 'CUIT/CUIL (for INMOBILIARIA role)';