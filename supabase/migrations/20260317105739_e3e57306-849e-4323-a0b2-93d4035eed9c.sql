
-- Add extended project fields
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS min_area numeric,
  ADD COLUMN IF NOT EXISTS max_area numeric,
  ADD COLUMN IF NOT EXISTS area_unit text DEFAULT 'm²',
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS town text,
  ADD COLUMN IF NOT EXISTS neighbourhood text,
  ADD COLUMN IF NOT EXISTS pin_location text,
  ADD COLUMN IF NOT EXISTS video_link text,
  ADD COLUMN IF NOT EXISTS view_360_link text,
  ADD COLUMN IF NOT EXISTS plans text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS pdf_catalogue_url text,
  ADD COLUMN IF NOT EXISTS interior_amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exterior_amenities text[] DEFAULT '{}';

-- Add extended project_units fields
ALTER TABLE public.project_units
  ADD COLUMN IF NOT EXISTS interior_amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exterior_amenities text[] DEFAULT '{}';

-- Create project-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view project images"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-images');
CREATE POLICY "Auth users can upload project images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images');
CREATE POLICY "Auth users can delete project images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-images');

-- Create project-plans storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('project-plans', 'project-plans', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view project plans"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-plans');
CREATE POLICY "Auth users can upload project plans"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-plans');
CREATE POLICY "Auth users can delete project plans"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-plans');

-- Create project-logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('project-logos', 'project-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view project logos"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-logos');
CREATE POLICY "Auth users can upload project logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-logos');

-- Create project-catalogues storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('project-catalogues', 'project-catalogues', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view project catalogues"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-catalogues');
CREATE POLICY "Auth users can upload project catalogues"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-catalogues');

-- Company owner RLS for projects
CREATE POLICY "Company owners can insert projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = projects.company_id AND companies.owner_user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Company owners can update own projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = projects.company_id AND companies.owner_user_id = auth.uid())
  );

CREATE POLICY "Company owners can delete own projects"
  ON public.projects FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE companies.id = projects.company_id AND companies.owner_user_id = auth.uid())
  );

-- Company owner RLS for project_units
CREATE POLICY "Company owners can insert units"
  ON public.project_units FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = project_units.project_id AND c.owner_user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Company owners can update own units"
  ON public.project_units FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = project_units.project_id AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can delete own units"
  ON public.project_units FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.companies c ON c.id = p.company_id
      WHERE p.id = project_units.project_id AND c.owner_user_id = auth.uid()
    )
  );
