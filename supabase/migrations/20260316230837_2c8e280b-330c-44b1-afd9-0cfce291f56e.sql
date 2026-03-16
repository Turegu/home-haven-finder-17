
-- Properties listing table
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL DEFAULT lpad(floor(random() * 100000000)::text, 8, '0'),
  title text NOT NULL,
  property_status text NOT NULL DEFAULT 'new' CHECK (property_status IN ('new', 'approved', 'rejected')),
  property_purpose text NOT NULL DEFAULT 'buy' CHECK (property_purpose IN ('buy', 'rent')),
  property_type text NOT NULL DEFAULT 'apartment',
  location text,
  price numeric,
  currency text DEFAULT 'USD',
  bedrooms integer,
  bathrooms integer,
  area numeric,
  area_unit text DEFAULT 'm²',
  description text,
  images text[],
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
  display_on_homepage boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active properties" ON public.properties
  FOR SELECT TO public USING (status = 'active' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert properties" ON public.properties
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update properties" ON public.properties
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete properties" ON public.properties
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Projects listing table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL DEFAULT lpad(floor(random() * 100000000)::text, 8, '0'),
  title text NOT NULL,
  project_status text NOT NULL DEFAULT 'new' CHECK (project_status IN ('new', 'approved', 'rejected')),
  project_type text NOT NULL DEFAULT 'residential',
  location text,
  developer text,
  min_price numeric,
  max_price numeric,
  currency text DEFAULT 'USD',
  min_units integer,
  max_units integer,
  completion_date text,
  description text,
  images text[],
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
  display_on_homepage boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active projects" ON public.projects
  FOR SELECT TO public USING (status = 'active' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update projects" ON public.projects
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Events listing table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL DEFAULT lpad(floor(random() * 100000000)::text, 8, '0'),
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'open_house',
  location text,
  event_date timestamptz,
  description text,
  images text[],
  organizer text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
  display_on_homepage boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active events" ON public.events
  FOR SELECT TO public USING (status = 'active' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update events" ON public.events
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete events" ON public.events
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
