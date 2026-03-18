INSERT INTO filter_categories (category_key, title, applies_to, sort_order, status)
VALUES ('bathrooms', 'Bathrooms', ARRAY['property', 'search'], 14, 'active');

INSERT INTO filter_options (category_id, title, sort_order, status)
SELECT fc.id, opt.title, opt.sort_order, 'active'
FROM filter_categories fc
CROSS JOIN (VALUES
  ('1', 1), ('2', 2), ('3', 3), ('4', 4), ('5', 5), ('6+', 6)
) AS opt(title, sort_order)
WHERE fc.category_key = 'bathrooms';