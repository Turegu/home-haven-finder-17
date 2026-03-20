
-- Helper function: check if a text matches with unaccent
CREATE OR REPLACE FUNCTION public.unaccent_match(haystack text, needle text)
RETURNS boolean
LANGUAGE sql IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT public.unaccent(lower(COALESCE(haystack, ''))) LIKE '%' || public.unaccent(lower(needle)) || '%'
$$;
