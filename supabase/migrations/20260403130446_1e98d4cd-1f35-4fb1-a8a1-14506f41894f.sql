
-- ISSUE 1: Restrict authenticated column access on companies
REVOKE SELECT ON public.companies FROM authenticated;
GRANT SELECT (id, name, name_ar, name_fr, logo_url, cover_url, about, about_ar, about_fr, membership, province, town, neighbourhood, company_type, company_types, service_areas, languages, is_verified, profile_classification, boost_end_date, created_at, pin_location, phone, whatsapp, email, registration_number) ON public.companies TO authenticated;

-- Owners can read ALL columns of their own company
CREATE POLICY "owners_read_own_company" ON public.companies
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- Agents can read their own company's full data
CREATE POLICY "agents_read_own_company" ON public.companies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.company_id = companies.id AND a.user_id = auth.uid()
    )
  );

-- ISSUE 2: Trigger to prevent owners from changing admin-only fields
CREATE OR REPLACE FUNCTION public.protect_company_admin_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- If caller is NOT an admin, reset protected fields to their old values
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_verified := OLD.is_verified;
    NEW.membership := OLD.membership;
    NEW.package_end_date := OLD.package_end_date;
    NEW.credit_balance := OLD.credit_balance;
    NEW.verification_token := OLD.verification_token;
    NEW.owner_user_id := OLD.owner_user_id;
    NEW.created_by := OLD.created_by;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_company_admin_fields_trigger
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_company_admin_fields();
