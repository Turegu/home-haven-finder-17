CREATE INDEX IF NOT EXISTS idx_properties_homepage ON public.properties USING btree (status, display_on_homepage) WHERE display_on_homepage = true AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_projects_homepage ON public.projects USING btree (status, display_on_homepage) WHERE display_on_homepage = true AND status = 'active';