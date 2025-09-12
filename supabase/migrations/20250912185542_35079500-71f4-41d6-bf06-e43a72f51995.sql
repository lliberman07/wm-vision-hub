-- Create table for storing investment simulations
CREATE TABLE public.investment_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  user_email TEXT NOT NULL,
  simulation_data JSONB NOT NULL,
  analysis_results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for PDF report requests
CREATE TABLE public.pdf_report_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID NOT NULL REFERENCES public.investment_simulations(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  pdf_url TEXT,
  error_message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.investment_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_report_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Allow all access to simulations" 
ON public.investment_simulations 
FOR ALL 
USING (true);

CREATE POLICY "Allow all access to PDF reports" 
ON public.pdf_report_requests 
FOR ALL 
USING (true);

-- Create function to generate reference numbers
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'SIM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT, 13, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_simulations_updated_at
BEFORE UPDATE ON public.investment_simulations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_simulations_reference ON public.investment_simulations(reference_number);
CREATE INDEX idx_simulations_email ON public.investment_simulations(user_email);
CREATE INDEX idx_pdf_requests_simulation ON public.pdf_report_requests(simulation_id);
CREATE INDEX idx_pdf_requests_status ON public.pdf_report_requests(status);