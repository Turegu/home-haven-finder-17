
-- Function to get distinct provinces efficiently
CREATE OR REPLACE FUNCTION public.get_distinct_provinces()
RETURNS TABLE(name text, ar text)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT province AS name, COALESCE(province_ar, '') AS ar
  FROM public.locations
  WHERE status = 'active'
  ORDER BY province;
$$;

-- Function to get distinct districts for a province
CREATE OR REPLACE FUNCTION public.get_distinct_districts(p_province text)
RETURNS TABLE(name text, ar text)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT district AS name, COALESCE(district_ar, '') AS ar
  FROM public.locations
  WHERE status = 'active' AND province = p_province
  ORDER BY district;
$$;

-- Function to get neighborhoods for a province+district
CREATE OR REPLACE FUNCTION public.get_neighborhoods(p_province text, p_district text)
RETURNS TABLE(name text, ar text)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT neighborhood AS name, COALESCE(neighborhood_ar, '') AS ar
  FROM public.locations
  WHERE status = 'active' AND province = p_province AND district = p_district
  ORDER BY neighborhood;
$$;
