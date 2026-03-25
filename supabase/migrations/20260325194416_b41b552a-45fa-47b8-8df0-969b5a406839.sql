CREATE OR REPLACE FUNCTION public.get_service_area_translations(p_areas text[])
RETURNS TABLE(original text, translated text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH input_areas AS (
    SELECT unnest(p_areas) AS area_name
  ),
  province_matches AS (
    SELECT DISTINCT ia.area_name AS original, l.province_ar AS translated
    FROM input_areas ia
    JOIN locations l ON l.status = 'active'
      AND public.unaccent(lower(l.province)) = public.unaccent(lower(ia.area_name))
      AND l.province_ar IS NOT NULL AND l.province_ar != ''
  ),
  district_matches AS (
    SELECT DISTINCT ia.area_name AS original, l.district_ar AS translated
    FROM input_areas ia
    JOIN locations l ON l.status = 'active'
      AND public.unaccent(lower(l.district)) = public.unaccent(lower(ia.area_name))
      AND l.district_ar IS NOT NULL AND l.district_ar != ''
  ),
  neighborhood_matches AS (
    SELECT DISTINCT ia.area_name AS original, l.neighborhood_ar AS translated
    FROM input_areas ia
    JOIN locations l ON l.status = 'active'
      AND public.unaccent(lower(l.neighborhood)) = public.unaccent(lower(ia.area_name))
      AND l.neighborhood_ar IS NOT NULL AND l.neighborhood_ar != ''
  )
  SELECT * FROM province_matches
  UNION ALL
  SELECT * FROM district_matches WHERE original NOT IN (SELECT original FROM province_matches)
  UNION ALL
  SELECT * FROM neighborhood_matches WHERE original NOT IN (SELECT original FROM province_matches) AND original NOT IN (SELECT original FROM district_matches);
$$;