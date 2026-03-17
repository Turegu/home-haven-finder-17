
-- Locations table with hierarchy: province > district/town > neighborhood
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  province text NOT NULL,
  province_ar text,
  district text NOT NULL,
  district_ar text,
  neighborhood text NOT NULL,
  neighborhood_ar text,
  country text NOT NULL DEFAULT 'Turkey',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast cascading lookups
CREATE INDEX idx_locations_province ON public.locations (province);
CREATE INDEX idx_locations_district ON public.locations (province, district);
CREATE INDEX idx_locations_neighborhood ON public.locations (province, district, neighborhood);
CREATE INDEX idx_locations_country ON public.locations (country);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Anyone can view active locations
CREATE POLICY "Anyone can view active locations"
  ON public.locations FOR SELECT
  TO public
  USING (status = 'active');

-- Admins can manage locations
CREATE POLICY "Admins can manage locations"
  ON public.locations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Location settings table (for country restriction, keyword limits, etc.)
CREATE TABLE public.location_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.location_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view location settings"
  ON public.location_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage location settings"
  ON public.location_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Default settings
INSERT INTO public.location_settings (setting_key, setting_value) VALUES
  ('allowed_country', 'Turkey'),
  ('max_keyword_suggestions', '10');
