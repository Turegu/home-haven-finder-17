
-- Add extended property fields
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS floor_level text,
  ADD COLUMN IF NOT EXISTS furniture text,
  ADD COLUMN IF NOT EXISTS parking_spaces integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS property_age text,
  ADD COLUMN IF NOT EXISTS property_orientation text,
  ADD COLUMN IF NOT EXISTS title_deed text,
  ADD COLUMN IF NOT EXISTS video_link text,
  ADD COLUMN IF NOT EXISTS view_360_link text,
  ADD COLUMN IF NOT EXISTS plans text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interior_amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exterior_amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rooms text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS town text,
  ADD COLUMN IF NOT EXISTS neighbourhood text,
  ADD COLUMN IF NOT EXISTS pin_location text,
  ADD COLUMN IF NOT EXISTS open_house_start timestamptz,
  ADD COLUMN IF NOT EXISTS open_house_end timestamptz,
  ADD COLUMN IF NOT EXISTS rent_duration text,
  ADD COLUMN IF NOT EXISTS property_classification text;

-- Create property-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property images
CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can delete property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-images');

-- Create property-plans storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('property-plans', 'property-plans', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view property plans"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-plans');

CREATE POLICY "Authenticated users can upload property plans"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-plans');

CREATE POLICY "Authenticated users can delete property plans"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-plans');

-- Allow company owners to insert properties for their company
CREATE POLICY "Company owners can insert properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = properties.company_id
      AND companies.owner_user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Allow company owners to update their own properties
CREATE POLICY "Company owners can update own properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = properties.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );

-- Allow company owners to delete their own properties
CREATE POLICY "Company owners can delete own properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = properties.company_id
      AND companies.owner_user_id = auth.uid()
    )
  );
