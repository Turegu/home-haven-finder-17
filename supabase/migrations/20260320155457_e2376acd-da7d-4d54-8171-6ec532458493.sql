
-- Create a function that returns property IDs matching a keyword with accent-insensitive search
CREATE OR REPLACE FUNCTION public.search_property_ids_by_keyword(p_keyword text)
RETURNS TABLE(property_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id AS property_id
  FROM properties
  WHERE status = 'active'
    AND (
      public.unaccent(lower(title)) LIKE '%' || public.unaccent(lower(p_keyword)) || '%' OR
      public.unaccent(lower(COALESCE(location,''))) LIKE '%' || public.unaccent(lower(p_keyword)) || '%' OR
      public.unaccent(lower(COALESCE(neighbourhood,''))) LIKE '%' || public.unaccent(lower(p_keyword)) || '%' OR
      public.unaccent(lower(COALESCE(town,''))) LIKE '%' || public.unaccent(lower(p_keyword)) || '%' OR
      public.unaccent(lower(COALESCE(province,''))) LIKE '%' || public.unaccent(lower(p_keyword)) || '%'
    );
$$;

-- Create a function that returns event IDs matching a keyword with accent-insensitive search
CREATE OR REPLACE FUNCTION public.search_event_ids_by_keyword(p_keyword text)
RETURNS TABLE(event_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id AS event_id
  FROM events
  WHERE status = 'active'
    AND (
      public.unaccent(lower(title)) LIKE '%' || public.unaccent(lower(p_keyword)) || '%' OR
      public.unaccent(lower(COALESCE(location,''))) LIKE '%' || public.unaccent(lower(p_keyword)) || '%' OR
      public.unaccent(lower(COALESCE(town,''))) LIKE '%' || public.unaccent(lower(p_keyword)) || '%' OR
      public.unaccent(lower(COALESCE(province,''))) LIKE '%' || public.unaccent(lower(p_keyword)) || '%'
    );
$$;
