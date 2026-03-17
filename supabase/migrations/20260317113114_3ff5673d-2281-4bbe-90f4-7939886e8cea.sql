
-- Create company-logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow company owners to upload to their folder
CREATE POLICY "Company owners can upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE owner_user_id = auth.uid()
  )
);

-- Allow company owners to update their logos
CREATE POLICY "Company owners can update logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE owner_user_id = auth.uid()
  )
);

-- Public read access
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');
