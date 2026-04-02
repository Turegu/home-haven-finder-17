-- Step 1: Revoke all SELECT from anon and authenticated
REVOKE SELECT ON public.companies FROM anon, authenticated;

-- Step 2: Grant anon SELECT only on safe public columns
GRANT SELECT (id, name, name_ar, name_fr, logo_url, cover_url, about, about_ar, about_fr, membership, province, town, neighbourhood, company_types, service_areas, languages, is_verified, profile_classification, boost_end_date, created_at, updated_at) ON public.companies TO anon;

-- Step 3: Grant authenticated full SELECT (owners/agents/admins need all columns)
GRANT SELECT ON public.companies TO authenticated;