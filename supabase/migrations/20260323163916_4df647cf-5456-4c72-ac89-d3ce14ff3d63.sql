
-- Bathrooms: translate "Any"
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"الكل"') WHERE id = '75619874-df73-4778-91e2-a478399139f8';

-- Rooms: translate "Any" and "Studio"
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"الكل"') WHERE id = 'ac2b83b9-7c83-4e23-ba3d-ed43efcc7f20';
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"استوديو"') WHERE id = '9e91e663-0633-4500-8292-ed74e5e6d422';

-- Project statuses
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"هيكل وتشطيب"') WHERE id = 'ed279fca-fee0-4a25-9048-574c37d15d7d';
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"قيد الإنشاء"') WHERE id = 'db1dff27-14ba-46c3-b725-2995287644ab';
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"مُجدد"') WHERE id = 'c5dc90b5-9e6c-4c4c-85d1-45add904f6f1';
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"مستعمل"') WHERE id = '99eabdc3-a450-4262-8fec-59b4bfdf690b';
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"جديد"') WHERE id = 'd604fcf6-7561-41b3-8c41-5465563ba033';
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"على المخطط"') WHERE id = 'e6add508-1387-49fd-bee1-761cd8ca910f';
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"مكتمل"') WHERE id = '34c8347e-a351-4ef1-b78a-6230d93e338e';
UPDATE filter_options SET translations = jsonb_set(COALESCE(translations, '{}')::jsonb, '{ar}', '"جاهز"') WHERE id = '32ece3ab-28a0-4fe4-86f4-fde837b60f4a';
