
-- Delete existing rooms options and re-insert full list from Excel
DELETE FROM filter_options WHERE category_id = 'c0e019e5-f2a5-4264-8d23-db784dad8b7e';

INSERT INTO filter_options (category_id, title, translations, sort_order, status) VALUES
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', 'Any', '{"tr":"Tümü"}', 1, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', 'Studio', '{"tr":"Stüdyo"}', 2, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '1+1', '{"tr":"1+1"}', 3, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '2+1', '{"tr":"2+1"}', 4, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '3+1', '{"tr":"3+1"}', 5, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '4+1', '{"tr":"4+1"}', 6, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '5+1', '{"tr":"5+1"}', 7, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '2', '{"tr":"2"}', 8, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '2+2', '{"tr":"2+2"}', 9, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '3+2', '{"tr":"3+2"}', 10, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '4+2', '{"tr":"4+2"}', 11, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '5+2', '{"tr":"5+2"}', 12, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '6+2', '{"tr":"6+2"}', 13, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '3', '{"tr":"3"}', 14, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '2+3', '{"tr":"2+3"}', 15, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '3+3', '{"tr":"3+3"}', 16, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '4+3', '{"tr":"4+3"}', 17, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '4', '{"tr":"4"}', 18, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '4+4', '{"tr":"4+4"}', 19, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '5+4', '{"tr":"5+4"}', 20, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '5', '{"tr":"5"}', 21, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '5+3', '{"tr":"5+3"}', 22, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '6', '{"tr":"6"}', 23, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '6+1', '{"tr":"6+1"}', 24, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '6+3', '{"tr":"6+3"}', 25, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '7', '{"tr":"7"}', 26, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '7+1', '{"tr":"7+1"}', 27, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '7+2', '{"tr":"7+2"}', 28, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '7+3', '{"tr":"7+3"}', 29, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '7+4', '{"tr":"7+4"}', 30, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '8+', '{"tr":"8+"}', 31, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '8+1', '{"tr":"8+1"}', 32, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '8+2', '{"tr":"8+2"}', 33, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '8+3', '{"tr":"8+3"}', 34, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '8+4', '{"tr":"8+4"}', 35, 'active'),
('c0e019e5-f2a5-4264-8d23-db784dad8b7e', '9+', '{"tr":"9+"}', 36, 'active');

-- Delete existing bathroom options and re-insert full list from Excel
DELETE FROM filter_options WHERE category_id = 'e9342eee-ebf0-4842-80cd-8ab32500c9b0';

INSERT INTO filter_options (category_id, title, translations, sort_order, status) VALUES
('e9342eee-ebf0-4842-80cd-8ab32500c9b0', 'Any', '{"tr":"Tümü"}', 1, 'active'),
('e9342eee-ebf0-4842-80cd-8ab32500c9b0', '1', '{"tr":"1"}', 2, 'active'),
('e9342eee-ebf0-4842-80cd-8ab32500c9b0', '2', '{"tr":"2"}', 3, 'active'),
('e9342eee-ebf0-4842-80cd-8ab32500c9b0', '3', '{"tr":"3"}', 4, 'active'),
('e9342eee-ebf0-4842-80cd-8ab32500c9b0', '4', '{"tr":"4"}', 5, 'active'),
('e9342eee-ebf0-4842-80cd-8ab32500c9b0', '5', '{"tr":"5"}', 6, 'active'),
('e9342eee-ebf0-4842-80cd-8ab32500c9b0', '6+', '{"tr":"6+"}', 7, 'active');
