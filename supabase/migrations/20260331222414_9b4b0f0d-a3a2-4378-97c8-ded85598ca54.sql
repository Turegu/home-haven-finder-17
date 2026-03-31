
-- 1. Fix user_notifications: Remove public INSERT, add authenticated INSERT with ownership check
DROP POLICY IF EXISTS "Anyone can insert user notifications" ON public.user_notifications;

CREATE POLICY "Authenticated can insert notifications for owned company"
ON public.user_notifications FOR INSERT
TO authenticated
WITH CHECK (
  source_company_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM companies c WHERE c.id = source_company_id AND c.owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM agents a WHERE a.company_id = source_company_id AND a.user_id = auth.uid())
  )
);

-- 2. Create verify_pattern RPC for server-side pattern verification
CREATE OR REPLACE FUNCTION public.verify_pattern(p_entity_id uuid, p_entered_pattern text, p_entity_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE stored text;
BEGIN
  IF p_entity_type = 'company' THEN
    SELECT pattern_code INTO stored FROM company_pattern_codes
    WHERE company_id = p_entity_id AND is_active = true;
  ELSIF p_entity_type = 'agent' THEN
    SELECT pattern_code INTO stored FROM agent_pattern_codes
    WHERE agent_id = p_entity_id AND is_active = true;
  ELSE
    RETURN false;
  END IF;
  RETURN stored IS NOT NULL AND stored = p_entered_pattern;
END;
$$;

-- Create verify_admin_pattern RPC for admin login
CREATE OR REPLACE FUNCTION public.verify_admin_pattern(p_entered_pattern text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE stored text;
  is_active boolean;
BEGIN
  SELECT setting_value INTO stored FROM admin_settings WHERE setting_key = 'admin_pattern_code';
  SELECT setting_value INTO is_active FROM admin_settings WHERE setting_key = 'admin_pattern_active';
  IF is_active::text = 'false' OR stored IS NULL OR stored = '' THEN
    RETURN true;
  END IF;
  RETURN stored = p_entered_pattern;
END;
$$;

-- Check if admin pattern is active (without exposing the code)
CREATE OR REPLACE FUNCTION public.check_admin_pattern_required()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_active text;
BEGIN
  SELECT setting_value INTO v_code FROM admin_settings WHERE setting_key = 'admin_pattern_code';
  SELECT setting_value INTO v_active FROM admin_settings WHERE setting_key = 'admin_pattern_active';
  RETURN v_code IS NOT NULL AND v_code != '' AND v_active IS DISTINCT FROM 'false';
END;
$$;

-- 3. Remove anon SELECT policies on pattern codes
DROP POLICY IF EXISTS "Public can view patterns for login" ON public.company_pattern_codes;
DROP POLICY IF EXISTS "Public can view agent patterns for login" ON public.agent_pattern_codes;

-- 4. Fix admin_settings: restrict public SELECT to non-sensitive keys only
DROP POLICY IF EXISTS "Anyone can view settings" ON public.admin_settings;

CREATE POLICY "Authenticated can view credit settings"
ON public.admin_settings FOR SELECT
TO authenticated
USING (setting_key IN (
  'premium_1_month_credits', 'premium_3_months_credits',
  'featured_1_month_credits', 'featured_3_months_credits',
  'boost_company_3_months_credits', 'boost_company_6_months_credits', 'boost_company_12_months_credits',
  'boost_agent_3_months_credits', 'boost_agent_6_months_credits', 'boost_agent_12_months_credits',
  'allowed_display_currency', 'site_name'
));

-- 5. Fix companies public SELECT: only show verified companies to public
DROP POLICY IF EXISTS "Anyone can view all companies" ON public.companies;

CREATE POLICY "Public can view verified companies"
ON public.companies FOR SELECT
TO public
USING (is_verified = true);

-- 6. Fix bank-logos storage policies with admin role check
DROP POLICY IF EXISTS "Admins can upload bank logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete bank logos" ON storage.objects;

CREATE POLICY "Admins can upload bank logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bank-logos'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete bank logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bank-logos'
  AND has_role(auth.uid(), 'admin'::app_role)
);
