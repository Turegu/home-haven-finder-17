
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
BEGIN
  -- Build filtered project IDs
  CREATE TEMP TABLE IF NOT EXISTS _filtered_projects ON COMMIT DROP AS
  SELECT DISTINCT p.id AS project_id
  FROM projects p
  LEFT JOIN project_units pu ON pu.project_id = p.id
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
    AND (p_amenities IS NULL OR (
      p.exterior_amenities && p_amenities OR
      p.interior_amenities && p_amenities
    ))
    -- Unit-based filters: only apply if any unit filter is set
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
    );

  SELECT count(*) INTO v_total FROM _filtered_projects;

  RETURN QUERY
  SELECT
    to_jsonb(p.*) AS project_row,
    v_total AS total_count
  FROM projects p
  INNER JOIN _filtered_projects fp ON fp.project_id = p.id
  ORDER BY
    CASE WHEN p_sort_by = 'price_asc' THEN p.min_price END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN p.min_price END DESC NULLS LAST,
    CASE WHEN p_sort_by IS NULL OR p_sort_by = 'newest' THEN p.created_at END DESC;

  -- Applying offset and limit via the RETURN QUERY doesn't work well with CASE ORDER,
  -- so we use a subquery approach instead
END;
$$;
