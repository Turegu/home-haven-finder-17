
-- Drop existing foreign keys and re-add with ON DELETE CASCADE

-- agents -> companies
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_company_id_fkey;
ALTER TABLE public.agents ADD CONSTRAINT agents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- properties -> companies
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_company_id_fkey;
ALTER TABLE public.properties ADD CONSTRAINT properties_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- projects -> companies
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_company_id_fkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- events -> companies
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_company_id_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- company_inbox -> companies
ALTER TABLE public.company_inbox DROP CONSTRAINT IF EXISTS company_inbox_company_id_fkey;
ALTER TABLE public.company_inbox ADD CONSTRAINT company_inbox_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- company_notifications -> companies
ALTER TABLE public.company_notifications DROP CONSTRAINT IF EXISTS company_notifications_company_id_fkey;
ALTER TABLE public.company_notifications ADD CONSTRAINT company_notifications_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- company_announcements -> companies
ALTER TABLE public.company_announcements DROP CONSTRAINT IF EXISTS company_announcements_company_id_fkey;
ALTER TABLE public.company_announcements ADD CONSTRAINT company_announcements_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- company_followers -> companies
ALTER TABLE public.company_followers DROP CONSTRAINT IF EXISTS company_followers_company_id_fkey;
ALTER TABLE public.company_followers ADD CONSTRAINT company_followers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- company_pattern_codes -> companies
ALTER TABLE public.company_pattern_codes DROP CONSTRAINT IF EXISTS company_pattern_codes_company_id_fkey;
ALTER TABLE public.company_pattern_codes ADD CONSTRAINT company_pattern_codes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- credit_transactions -> companies
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_company_id_fkey;
ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
