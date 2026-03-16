
-- Membership packages table (admin-managed)
CREATE TABLE public.membership_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_type text NOT NULL UNIQUE CHECK (package_type IN ('basic', 'lite', 'plus', 'pro')),
  name text NOT NULL,
  tagline text,
  monthly_price numeric NOT NULL DEFAULT 0,
  quarterly_price numeric NOT NULL DEFAULT 0,
  semiannual_price numeric NOT NULL DEFAULT 0,
  annual_price numeric NOT NULL DEFAULT 0,
  max_agents integer NOT NULL DEFAULT 0,
  max_properties integer NOT NULL DEFAULT 0,
  max_projects integer NOT NULL DEFAULT 0,
  max_events integer NOT NULL DEFAULT 0,
  has_property_requests boolean NOT NULL DEFAULT false,
  has_company_agent_search boolean NOT NULL DEFAULT false,
  has_home_logo boolean NOT NULL DEFAULT false,
  has_company_profile boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view packages (public page)
CREATE POLICY "Anyone can view packages" ON public.membership_packages
  FOR SELECT TO public USING (true);

-- Only admins can manage packages
CREATE POLICY "Admins can manage packages" ON public.membership_packages
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Advertising requests table
CREATE TABLE public.advertising_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advertising_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request (public form)
CREATE POLICY "Anyone can submit request" ON public.advertising_requests
  FOR INSERT TO public WITH CHECK (true);

-- Only admins can view/manage requests
CREATE POLICY "Admins can view requests" ON public.advertising_requests
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update requests" ON public.advertising_requests
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete requests" ON public.advertising_requests
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default packages
INSERT INTO public.membership_packages (package_type, name, tagline, monthly_price, quarterly_price, semiannual_price, annual_price, max_agents, max_properties, max_projects, max_events, has_property_requests, has_company_agent_search, has_home_logo, sort_order) VALUES
('basic', 'Basic Package', 'Basic Plan Get Started', 97, 250, 498, 900, 354, 9, 1, 1, false, true, true, 1),
('lite', 'Lite Plan', 'Lite Plan Get Started', 197, 550, 700, 9000, 25, 2, 2, 2, false, false, true, 2),
('plus', 'Plus Plan', 'Plus Plan Get Started', 300, 700, 900, 1200, 25, 12, 3, 3, true, true, false, 3),
('pro', 'Pro', 'Pro', 500, 900, 1200, 1500, 1000, 60, 60, 60, true, true, true, 4);

-- Trigger for updated_at
CREATE TRIGGER update_membership_packages_updated_at
  BEFORE UPDATE ON public.membership_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertising_requests_updated_at
  BEFORE UPDATE ON public.advertising_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
