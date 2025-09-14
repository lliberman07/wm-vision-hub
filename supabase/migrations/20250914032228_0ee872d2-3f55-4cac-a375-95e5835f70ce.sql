-- Create enums for application management
CREATE TYPE public.application_type AS ENUM ('individual', 'company');
CREATE TYPE public.application_status AS ENUM ('draft', 'pending', 'completed', 'approved', 'denied');
CREATE TYPE public.employment_status AS ENUM ('employed', 'self-employed', 'other');

-- Create applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.application_type NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status public.application_status NOT NULL DEFAULT 'draft',
  resume_code UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applicants table
CREATE TABLE public.applicants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  full_name TEXT,
  document_id TEXT,
  role_in_company TEXT,
  ownership_percentage NUMERIC,
  income NUMERIC,
  employment_status public.employment_status,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
CREATE POLICY "Users can view applications by resume code" 
ON public.applications 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update applications by resume code" 
ON public.applications 
FOR UPDATE 
USING (true);

CREATE POLICY "Superadmins can manage all applications" 
ON public.applications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'superadmin'
));

-- RLS Policies for applicants
CREATE POLICY "Users can manage applicants via resume code" 
ON public.applicants 
FOR ALL 
USING (true);

CREATE POLICY "Superadmins can manage all applicants" 
ON public.applicants 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'superadmin'
));

-- RLS Policies for documents
CREATE POLICY "Users can manage documents via resume code" 
ON public.documents 
FOR ALL 
USING (true);

CREATE POLICY "Superadmins can manage all documents" 
ON public.documents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'superadmin'
));

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', false);

-- Storage policies for documents
CREATE POLICY "Users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Users can view documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'application-documents');

CREATE POLICY "Superadmins can manage all documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'application-documents' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'superadmin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at
BEFORE UPDATE ON public.applicants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();