-- Add inquiry_type and dynamic_fields to contact_submissions
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS inquiry_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS dynamic_fields JSONB DEFAULT '{}'::jsonb;

-- Create index for inquiry_type for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_inquiry_type 
ON public.contact_submissions(inquiry_type);

-- Add comment to explain dynamic_fields usage
COMMENT ON COLUMN public.contact_submissions.dynamic_fields IS 
'Stores additional fields based on inquiry_type: demo (company_size, preferred_demo_date), pricing (budget_range, timeline), support (product, issue_description)';
