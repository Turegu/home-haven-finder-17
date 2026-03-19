
CREATE OR REPLACE FUNCTION public.search_projects_by_units(
  p_province text DEFAULT NULL,
  p_district text DEFAULT NULL,
  p_neighborhood text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_unit_types text[] DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_min_area numeric DEFAULT NULL,
  p_max_area numeric DEFAULT NULL,
  p_rooms text[] DEFAULT NULL,
  p_project_status text DEFAULT NULL,
  p_amenities text[] DEFAULT NULL,
  p_sort_by text DEFAULT 'newest',
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 21
)
RETURNS TABLE(
  project_row jsonb,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT DISTINCT p.id AS pid
    FROM projects p
    WHERE p.status = 'active'
      AND (p_province IS NULL OR p.province = p_province)
      AND (p_district IS NULL OR p.town = p_district)
      AND (p_neighborhood IS NULL OR p.neighbourhood = p_neighborhood)
      AND (p_keyword IS NULL OR (
        p.title ILIKE '%' || p_keyword || '%' OR
        p.location ILIKE '%' || p_keyword || '%' OR
        p.developer ILIKE '%' || p_keyword || '%' OR
        p.neighbourhood ILIKE '%' || p_keyword || '%' OR
        p.town ILIKE '%' || p_keyword || '%' OR
        p.province ILIKE '%' || p_keyword || '%'
      ))
      AND (p_project_status IS NULL OR p.project_status = p_project_status)
      AND (p_amenities IS NULL OR p.exterior_amenities && p_amenities OR p.interior_amenities && p_amenities)
      AND (
        (p_unit_types IS NULL AND p_min_price IS NULL AND p_max_price IS NULL AND p_min_area IS NULL AND p_max_area IS NULL AND p_rooms IS NULL)
        OR EXISTS (
          SELECT 1 FROM project_units u
          WHERE u.project_id = p.id
            AND (p_unit_types IS NULL OR u.unit_type = ANY(p_unit_types))
            AND (p_min_price IS NULL OR u.price >= p_min_price)
            AND (p_max_price IS NULL OR u.price <= p_max_price)
            AND (p_min_area IS NULL OR u.area >= p_min_area)
            AND (p_max_area IS NULL OR u.area <= p_max_area)
            AND (p_rooms IS NULL OR u.rooms = ANY(p_rooms))
        )
      )
  ),
  counted AS (
    SELECT count(*) AS cnt FROM filtered
  )
  SELECT
    to_jsonb(p.*) AS project_row,
    c.cnt AS total_count
  FROM projects p
  INNER JOIN filtered f ON f.pid = p.id
  CROSS JOIN counted c
  ORDER BY
    CASE WHEN p_sort_by = 'price_asc' THEN p.min_price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN p.min_price END DESC NULLS LAST,
    CASE WHEN p_sort_by IS NULL OR p_sort_by NOT IN ('price_asc','price_desc') THEN extract(epoch from p.created_at) END DESC
  OFFSET p_offset
  LIMIT p_limit;
$$;
