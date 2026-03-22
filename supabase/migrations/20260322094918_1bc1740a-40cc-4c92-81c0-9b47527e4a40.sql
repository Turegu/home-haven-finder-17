-- Drop the old hardcoded policy
DROP POLICY IF EXISTS "Plus and Pro companies can view property requests" ON public.property_requests;

-- Create new policy that checks membership_packages.has_property_requests flag
CREATE POLICY "Companies with property_requests access can view"
ON public.property_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    JOIN public.membership_packages mp ON mp.package_type = c.membership::text
    WHERE c.owner_user_id = auth.uid()
      AND c.is_verified = true
      AND mp.has_property_requests = true
  )
);