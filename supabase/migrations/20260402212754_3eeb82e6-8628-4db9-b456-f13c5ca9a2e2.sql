
-- ============================================================
-- 1. FIX BROKEN STORAGE POLICIES (14 policies across 7 buckets)
-- ============================================================

-- Drop all broken policies
DROP POLICY IF EXISTS "Agent owners can delete agent avatars" ON storage.objects;
DROP POLICY IF EXISTS "Agent owners can upload agent avatars" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can delete project images" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can delete project plans" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can upload project plans" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can delete property plans" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can upload property plans" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can upload project logos" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can upload project catalogues" ON storage.objects;
DROP POLICY IF EXISTS "Verified owners can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Verified owners can upload event images" ON storage.objects;

-- Helper: check if user owns or is agent of a company matching the file path
CREATE OR REPLACE FUNCTION public.storage_user_owns_path(file_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id::text = (storage.foldername(file_name))[1]
      AND (
        c.owner_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid())
      )
  )
$$;

-- agent-avatars
CREATE POLICY "Agent owners can upload agent avatars" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agent-avatars' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

CREATE POLICY "Agent owners can delete agent avatars" ON storage.objects FOR DELETE
USING (bucket_id = 'agent-avatars' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

-- property-images
CREATE POLICY "Company owners can upload property images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

CREATE POLICY "Company owners can delete property images" ON storage.objects FOR DELETE
USING (bucket_id = 'property-images' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

-- property-plans
CREATE POLICY "Company owners can upload property plans" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-plans' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

CREATE POLICY "Company owners can delete property plans" ON storage.objects FOR DELETE
USING (bucket_id = 'property-plans' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

-- project-images
CREATE POLICY "Company owners can upload project images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

CREATE POLICY "Company owners can delete project images" ON storage.objects FOR DELETE
USING (bucket_id = 'project-images' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

-- project-plans
CREATE POLICY "Company owners can upload project plans" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-plans' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

CREATE POLICY "Company owners can delete project plans" ON storage.objects FOR DELETE
USING (bucket_id = 'project-plans' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

-- project-logos
CREATE POLICY "Company owners can upload project logos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-logos' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

-- project-catalogues
CREATE POLICY "Company owners can upload project catalogues" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-catalogues' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

-- event-images
CREATE POLICY "Verified owners can upload event images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

CREATE POLICY "Verified owners can delete event images" ON storage.objects FOR DELETE
USING (bucket_id = 'event-images' AND (has_role(auth.uid(), 'admin'::app_role) OR public.storage_user_owns_path(name)));

-- ============================================================
-- 2. FIX COMPANY VERIFICATION TOKEN EXPOSURE
-- ============================================================

-- Revoke direct column access on sensitive columns from anon and authenticated
REVOKE SELECT (verification_token, owner_user_id, credit_balance) ON public.companies FROM anon;

-- ============================================================
-- 3. FIX ANALYTICS INSERT VALIDATION  
-- ============================================================

-- Add CHECK constraints for valid listing_type
ALTER TABLE public.listing_views ADD CONSTRAINT listing_views_valid_type
  CHECK (listing_type IN ('property', 'project'));

ALTER TABLE public.listing_impressions ADD CONSTRAINT listing_impressions_valid_type
  CHECK (listing_type IN ('property', 'project'));

ALTER TABLE public.listing_inquiry_clicks ADD CONSTRAINT listing_inquiry_clicks_valid_type
  CHECK (listing_type IN ('property', 'project'));

-- Replace open INSERT policies with validated ones
DROP POLICY IF EXISTS "Anyone can insert views" ON public.listing_views;
DROP POLICY IF EXISTS "Anyone can insert impressions" ON public.listing_impressions;
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.listing_inquiry_clicks;

-- Create security definer function to validate listing exists
CREATE OR REPLACE FUNCTION public.listing_exists(p_listing_id uuid, p_listing_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_listing_type = 'property' THEN EXISTS (SELECT 1 FROM properties WHERE id = p_listing_id AND status = 'active')
    WHEN p_listing_type = 'project' THEN EXISTS (SELECT 1 FROM projects WHERE id = p_listing_id AND status = 'active')
    ELSE false
  END
$$;

-- New validated INSERT policies
CREATE POLICY "Validated insert views" ON public.listing_views FOR INSERT
WITH CHECK (public.listing_exists(listing_id, listing_type));

CREATE POLICY "Validated insert impressions" ON public.listing_impressions FOR INSERT
WITH CHECK (public.listing_exists(listing_id, listing_type));

CREATE POLICY "Validated insert clicks" ON public.listing_inquiry_clicks FOR INSERT
WITH CHECK (public.listing_exists(listing_id, listing_type));
