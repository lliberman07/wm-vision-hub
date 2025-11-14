-- Extend contact_submissions table for tracking and WM/Granada separation
ALTER TABLE public.contact_submissions
  -- Source identification
  ADD COLUMN source TEXT NOT NULL DEFAULT 'wm' 
    CHECK (source IN ('wm', 'granada')),
  ADD COLUMN tenant_id UUID REFERENCES public.pms_tenants(id),
  
  -- Tracking and follow-up
  ADD COLUMN status TEXT NOT NULL DEFAULT 'new' 
    CHECK (status IN ('new', 'contacted', 'in_progress', 'qualified', 'converted', 'archived')),
  ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN assigned_to UUID REFERENCES auth.users(id),
  
  -- Actions and notes
  ADD COLUMN last_action_type TEXT CHECK (last_action_type IN ('email', 'call', 'whatsapp', 'meeting', 'other')),
  ADD COLUMN last_action_date TIMESTAMPTZ,
  ADD COLUMN last_action_notes TEXT,
  ADD COLUMN internal_notes TEXT,
  
  -- Metadata
  ADD COLUMN tags TEXT[],
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

-- Indexes for performance
CREATE INDEX idx_contact_submissions_source ON public.contact_submissions(source);
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX idx_contact_submissions_assigned_to ON public.contact_submissions(assigned_to);
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- Comments
COMMENT ON COLUMN public.contact_submissions.source IS 'Platform source: wm or granada';
COMMENT ON COLUMN public.contact_submissions.status IS 'Lead status in sales pipeline';
COMMENT ON COLUMN public.contact_submissions.priority IS 'Contact priority level';
COMMENT ON COLUMN public.contact_submissions.last_action_type IS 'Type of last contact action taken';

-- Create contact_actions table for historical tracking
CREATE TABLE public.contact_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contact_submissions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('email', 'call', 'whatsapp', 'meeting', 'note', 'status_change', 'other')),
  action_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contact_actions_contact_id ON public.contact_actions(contact_id);
CREATE INDEX idx_contact_actions_action_date ON public.contact_actions(action_date DESC);

COMMENT ON TABLE public.contact_actions IS 'Historical log of all actions taken on contact submissions';

-- Enable RLS
ALTER TABLE public.contact_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_submissions
CREATE POLICY "Granada admins can view Granada contacts"
  ON public.contact_submissions FOR SELECT
  USING (
    source = 'granada' AND is_granada_admin(auth.uid())
  );

CREATE POLICY "Granada admins can update Granada contacts"
  ON public.contact_submissions FOR UPDATE
  USING (
    source = 'granada' AND is_granada_admin(auth.uid())
  );

CREATE POLICY "WM admins can view WM contacts"
  ON public.contact_submissions FOR SELECT
  USING (
    source = 'wm' AND (
      has_role(auth.uid(), 'superadmin'::user_role_type) OR 
      has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
    )
  );

CREATE POLICY "WM admins can update WM contacts"
  ON public.contact_submissions FOR UPDATE
  USING (
    source = 'wm' AND (
      has_role(auth.uid(), 'superadmin'::user_role_type) OR 
      has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
    )
  );

-- RLS Policies for contact_actions
CREATE POLICY "Admins can view contact actions"
  ON public.contact_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contact_submissions cs
      WHERE cs.id = contact_actions.contact_id
      AND (
        (cs.source = 'granada' AND is_granada_admin(auth.uid()))
        OR
        (cs.source = 'wm' AND (
          has_role(auth.uid(), 'superadmin'::user_role_type) OR 
          has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)
        ))
      )
    )
  );

CREATE POLICY "Granada admins can insert contact actions"
  ON public.contact_actions FOR INSERT
  WITH CHECK (
    is_granada_admin(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.contact_submissions cs
      WHERE cs.id = contact_actions.contact_id
      AND cs.source = 'granada'
    )
  );

CREATE POLICY "WM admins can insert contact actions"
  ON public.contact_actions FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'superadmin'::user_role_type) OR 
     has_role(auth.uid(), 'admin'::user_role_type, 'WM'::module_type)) AND
    EXISTS (
      SELECT 1 FROM public.contact_submissions cs
      WHERE cs.id = contact_actions.contact_id
      AND cs.source = 'wm'
    )
  );