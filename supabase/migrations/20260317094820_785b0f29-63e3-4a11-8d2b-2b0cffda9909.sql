
-- CMS pages table: stores editable content sections per page as JSONB
CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL UNIQUE,
  page_title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view CMS pages"
  ON public.cms_pages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage CMS pages"
  ON public.cms_pages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Featured locations table: admin-managed location cards with image, name, link
CREATE TABLE public.featured_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active featured locations"
  ON public.featured_locations FOR SELECT
  TO public
  USING (status = 'active' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage featured locations"
  ON public.featured_locations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_featured_locations_updated_at
  BEFORE UPDATE ON public.featured_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for CMS images (hero banners, featured location thumbnails)
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-images', 'cms-images', true);

CREATE POLICY "Anyone can view CMS images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-images');

CREATE POLICY "Admins can upload CMS images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cms-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update CMS images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'cms-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete CMS images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'cms-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Seed CMS pages with default content
INSERT INTO public.cms_pages (page_slug, page_title, content) VALUES
('home', 'Home Page', '{
  "hero": {
    "title": "Your Property, Our Priority",
    "subtitle": "Starting at just $10 a day, take advantage of our limited-time discounts!",
    "image_url": "",
    "link_url": "",
    "link_text": "Experience",
    "enable_link": true
  },
  "second_banner": {
    "image_url": "",
    "link_url": ""
  },
  "featured_properties": {
    "title": "Featured Properties",
    "tagline": "Handpicked properties by our team"
  },
  "featured_projects": {
    "title": "Featured Projects",
    "tagline": "Handpicked projects by our team"
  },
  "featured_locations": {
    "title": "Featured Locations",
    "tagline": "Find Your Neighborhood"
  },
  "partners": {
    "title": "Our Partners",
    "tagline": "We only work with the best companies around the globe"
  }
}'::jsonb);
