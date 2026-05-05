
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_project_status_check;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_status_check;

ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('active','deactivated','draft'));
ALTER TABLE public.properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('active','deactivated','draft'));
