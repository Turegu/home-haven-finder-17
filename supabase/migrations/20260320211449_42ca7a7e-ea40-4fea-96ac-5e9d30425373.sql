
CREATE TABLE public.property_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  reporter_email TEXT,
  reporter_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a report (guests too)
CREATE POLICY "Anyone can create a report"
  ON public.property_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view reports
CREATE POLICY "Admins can view all reports"
  ON public.property_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update reports (e.g. change status)
CREATE POLICY "Admins can update reports"
  ON public.property_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
