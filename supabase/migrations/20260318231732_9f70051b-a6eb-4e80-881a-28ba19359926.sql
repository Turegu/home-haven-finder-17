INSERT INTO filter_categories (category_key, title, applies_to, sort_order, status)
VALUES ('project_statuses', 'Project Status', ARRAY['project', 'search'], 15, 'active');

INSERT INTO filter_options (category_id, title, sort_order, status)
SELECT fc.id, opt.title, opt.sort_order, 'active'
FROM filter_categories fc
CROSS JOIN (VALUES
  ('Shell And Core', 1), ('Under Construction', 2), ('Renovated', 3), ('Second-Hand', 4), ('New', 5), ('Off Plan', 6), ('Completed', 7), ('Ready', 8)
) AS opt(title, sort_order)
WHERE fc.category_key = 'project_statuses';