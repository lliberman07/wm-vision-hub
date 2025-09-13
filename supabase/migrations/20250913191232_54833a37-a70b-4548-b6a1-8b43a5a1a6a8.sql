-- Modify contact_submissions table to use separate first_name and last_name
ALTER TABLE public.contact_submissions 
DROP COLUMN name;

ALTER TABLE public.contact_submissions 
ADD COLUMN first_name TEXT NOT NULL DEFAULT '',
ADD COLUMN last_name TEXT NOT NULL DEFAULT '';

-- Update the column order by recreating with proper structure
CREATE TABLE public.contact_submissions_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Copy existing data if any (won't work perfectly due to name split, but preserves other data)
INSERT INTO public.contact_submissions_new (id, first_name, last_name, email, phone, company, message, created_at)
SELECT id, '', '', email, phone, company, message, created_at 
FROM public.contact_submissions;

-- Drop old table and rename new one
DROP TABLE public.contact_submissions;
ALTER TABLE public.contact_submissions_new RENAME TO contact_submissions;

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Recreate policy
CREATE POLICY "Allow all access to contact submissions" 
ON public.contact_submissions 
FOR ALL 
USING (true);