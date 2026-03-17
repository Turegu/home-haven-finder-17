
-- Property Types
CREATE TABLE public.property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage property_types" ON public.property_types FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active property_types" ON public.property_types FOR SELECT TO public USING (status = 'active' OR has_role(auth.uid(), 'admin'));

-- Project Types
CREATE TABLE public.project_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage project_types" ON public.project_types FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active project_types" ON public.project_types FOR SELECT TO public USING (status = 'active' OR has_role(auth.uid(), 'admin'));

-- Project Statuses
CREATE TABLE public.project_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage project_statuses" ON public.project_statuses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active project_statuses" ON public.project_statuses FOR SELECT TO public USING (status = 'active' OR has_role(auth.uid(), 'admin'));

-- Interior Amenities
CREATE TABLE public.interior_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.interior_amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage interior_amenities" ON public.interior_amenities FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active interior_amenities" ON public.interior_amenities FOR SELECT TO public USING (status = 'active' OR has_role(auth.uid(), 'admin'));

-- Exterior Amenities
CREATE TABLE public.exterior_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exterior_amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage exterior_amenities" ON public.exterior_amenities FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active exterior_amenities" ON public.exterior_amenities FOR SELECT TO public USING (status = 'active' OR has_role(auth.uid(), 'admin'));

-- Partners (logo + url for homepage slider)
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  logo_url text,
  link_url text,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage partners" ON public.partners FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active partners" ON public.partners FOR SELECT TO public USING (status = 'active' OR has_role(auth.uid(), 'admin'));

-- Storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public) VALUES ('partner-logos', 'partner-logos', true);
CREATE POLICY "Admins can upload partner logos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'partner-logos' AND (SELECT has_role(auth.uid(), 'admin'))) WITH CHECK (bucket_id = 'partner-logos' AND (SELECT has_role(auth.uid(), 'admin')));
CREATE POLICY "Anyone can view partner logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'partner-logos');

-- Storage bucket for featured location images
INSERT INTO storage.buckets (id, name, public) VALUES ('featured-location-images', 'featured-location-images', true);
CREATE POLICY "Admins can upload location images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'featured-location-images' AND (SELECT has_role(auth.uid(), 'admin'))) WITH CHECK (bucket_id = 'featured-location-images' AND (SELECT has_role(auth.uid(), 'admin')));
CREATE POLICY "Anyone can view location images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'featured-location-images');
