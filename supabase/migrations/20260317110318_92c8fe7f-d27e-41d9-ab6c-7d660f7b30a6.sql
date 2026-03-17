
-- Add new columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'open_invitation',
  ADD COLUMN IF NOT EXISTS province text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS town text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS neighbourhood text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pin_location text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_link text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pdf_catalogue_url text DEFAULT NULL;

-- Create event-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for event images
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Company owners can upload event images
CREATE POLICY "Company owners can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

-- Company owners can delete event images
CREATE POLICY "Company owners can delete event images"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');

-- RLS: Company owners can insert their own events
CREATE POLICY "Company owners can insert events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = events.company_id
    AND companies.owner_user_id = auth.uid()
  )) OR has_role(auth.uid(), 'admin'::app_role)
);

-- RLS: Company owners can update their own events
CREATE POLICY "Company owners can update own events"
ON public.events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = events.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

-- RLS: Company owners can delete their own events
CREATE POLICY "Company owners can delete own events"
ON public.events FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = events.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

-- Company owners can view their own events (including inactive)
CREATE POLICY "Company owners can view own events"
ON public.events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = events.company_id
    AND companies.owner_user_id = auth.uid()
  )
);
