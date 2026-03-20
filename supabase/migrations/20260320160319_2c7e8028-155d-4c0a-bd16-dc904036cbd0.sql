
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('map_provider', 'google')
ON CONFLICT DO NOTHING;
