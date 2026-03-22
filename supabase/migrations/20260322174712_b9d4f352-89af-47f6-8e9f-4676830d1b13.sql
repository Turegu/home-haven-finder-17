
-- Listing analytics: impressions (appeared in search results)
CREATE TABLE public.listing_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  listing_type text NOT NULL DEFAULT 'property',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Listing analytics: page views (direct hits)
CREATE TABLE public.listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  listing_type text NOT NULL DEFAULT 'property',
  viewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Listing analytics: inquiry clicks (WhatsApp, Call, Email)
CREATE TABLE public.listing_inquiry_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  listing_type text NOT NULL DEFAULT 'property',
  click_type text NOT NULL DEFAULT 'whatsapp',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listing_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_inquiry_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous tracking)
CREATE POLICY "Anyone can insert impressions" ON public.listing_impressions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can insert views" ON public.listing_views FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can insert clicks" ON public.listing_inquiry_clicks FOR INSERT TO public WITH CHECK (true);

-- Admins can read all
CREATE POLICY "Admins can read all impressions" ON public.listing_impressions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read all views" ON public.listing_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read all clicks" ON public.listing_inquiry_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Company owners can read analytics for their own listings
CREATE POLICY "Company owners can read own property impressions" ON public.listing_impressions FOR SELECT TO authenticated
USING (
  (listing_type = 'property' AND EXISTS (SELECT 1 FROM properties p JOIN companies c ON c.id = p.company_id WHERE p.id = listing_impressions.listing_id AND c.owner_user_id = auth.uid()))
  OR (listing_type = 'project' AND EXISTS (SELECT 1 FROM projects p JOIN companies c ON c.id = p.company_id WHERE p.id = listing_impressions.listing_id AND c.owner_user_id = auth.uid()))
);

CREATE POLICY "Company owners can read own property views" ON public.listing_views FOR SELECT TO authenticated
USING (
  (listing_type = 'property' AND EXISTS (SELECT 1 FROM properties p JOIN companies c ON c.id = p.company_id WHERE p.id = listing_views.listing_id AND c.owner_user_id = auth.uid()))
  OR (listing_type = 'project' AND EXISTS (SELECT 1 FROM projects p JOIN companies c ON c.id = p.company_id WHERE p.id = listing_views.listing_id AND c.owner_user_id = auth.uid()))
);

CREATE POLICY "Company owners can read own property clicks" ON public.listing_inquiry_clicks FOR SELECT TO authenticated
USING (
  (listing_type = 'property' AND EXISTS (SELECT 1 FROM properties p JOIN companies c ON c.id = p.company_id WHERE p.id = listing_inquiry_clicks.listing_id AND c.owner_user_id = auth.uid()))
  OR (listing_type = 'project' AND EXISTS (SELECT 1 FROM projects p JOIN companies c ON c.id = p.company_id WHERE p.id = listing_inquiry_clicks.listing_id AND c.owner_user_id = auth.uid()))
);

-- Agents can read analytics for their assigned listings
CREATE POLICY "Agents can read own impressions" ON public.listing_impressions FOR SELECT TO authenticated
USING (
  (listing_type = 'property' AND EXISTS (SELECT 1 FROM properties p JOIN agents a ON a.id = p.agent_id WHERE p.id = listing_impressions.listing_id AND a.user_id = auth.uid()))
  OR (listing_type = 'project' AND EXISTS (SELECT 1 FROM projects p JOIN agents a ON a.id = p.agent_id WHERE p.id = listing_impressions.listing_id AND a.user_id = auth.uid()))
);

CREATE POLICY "Agents can read own views" ON public.listing_views FOR SELECT TO authenticated
USING (
  (listing_type = 'property' AND EXISTS (SELECT 1 FROM properties p JOIN agents a ON a.id = p.agent_id WHERE p.id = listing_views.listing_id AND a.user_id = auth.uid()))
  OR (listing_type = 'project' AND EXISTS (SELECT 1 FROM projects p JOIN agents a ON a.id = p.agent_id WHERE p.id = listing_views.listing_id AND a.user_id = auth.uid()))
);

CREATE POLICY "Agents can read own clicks" ON public.listing_inquiry_clicks FOR SELECT TO authenticated
USING (
  (listing_type = 'property' AND EXISTS (SELECT 1 FROM properties p JOIN agents a ON a.id = p.agent_id WHERE p.id = listing_inquiry_clicks.listing_id AND a.user_id = auth.uid()))
  OR (listing_type = 'project' AND EXISTS (SELECT 1 FROM projects p JOIN agents a ON a.id = p.agent_id WHERE p.id = listing_inquiry_clicks.listing_id AND a.user_id = auth.uid()))
);

-- Create indexes for performance
CREATE INDEX idx_listing_impressions_listing ON public.listing_impressions(listing_id, listing_type);
CREATE INDEX idx_listing_impressions_created ON public.listing_impressions(created_at);
CREATE INDEX idx_listing_views_listing ON public.listing_views(listing_id, listing_type);
CREATE INDEX idx_listing_views_created ON public.listing_views(created_at);
CREATE INDEX idx_listing_inquiry_clicks_listing ON public.listing_inquiry_clicks(listing_id, listing_type);
