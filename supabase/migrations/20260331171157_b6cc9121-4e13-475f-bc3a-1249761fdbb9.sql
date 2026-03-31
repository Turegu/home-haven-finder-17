
DROP FUNCTION IF EXISTS public.search_property_ids_by_keyword(text);

CREATE OR REPLACE FUNCTION public.search_property_ids_by_keyword(p_keyword text)
RETURNS TABLE(property_id uuid, rank real)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS property_id,
    (ts_rank(p.search_vector, query) *
      CASE
        WHEN p.property_classification = 'premium' THEN 2.0
        WHEN p.property_classification = 'featured' THEN 1.5
        ELSE 1.0
      END)::real AS rank
  FROM properties p,
    websearch_to_tsquery('simple', p_keyword) query
  WHERE p.search_vector @@ query
    AND p.status = 'active'
  ORDER BY rank DESC;
END;
$$;
