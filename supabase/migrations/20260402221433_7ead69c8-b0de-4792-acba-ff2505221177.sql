-- Hide sensitive agent columns from anonymous access
REVOKE SELECT ON public.agents FROM anon;

GRANT SELECT (
  id, name, name_ar, name_fr,
  avatar_url,
  designation, designation_ar, designation_fr,
  description, description_ar, description_fr,
  languages, service_areas,
  status, profile_classification, boost_end_date,
  company_id, created_at
) ON public.agents TO anon;