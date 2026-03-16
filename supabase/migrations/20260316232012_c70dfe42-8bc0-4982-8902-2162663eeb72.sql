
-- Create banners table
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  page_name text NOT NULL DEFAULT 'buy',
  banner_type text NOT NULL DEFAULT 'horizontal',
  page_position integer NOT NULL DEFAULT 1,
  image_url text,
  link_url text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Public can view active banners within date range
CREATE POLICY "Anyone can view active banners" ON public.banners
  FOR SELECT TO public
  USING (status = 'active');

-- Admins full access
CREATE POLICY "Admins can manage banners" ON public.banners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Storage policies for banners bucket
CREATE POLICY "Anyone can view banner images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banner images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update banner images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banner images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));
