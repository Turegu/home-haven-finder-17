
-- Company notifications (system alerts, package updates, follows, etc.)
CREATE TABLE public.company_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text DEFAULT NULL,
  notification_type text NOT NULL DEFAULT 'system',
  posted_by text DEFAULT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can view own notifications"
ON public.company_notifications FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = company_notifications.company_id AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Company owners can update own notifications"
ON public.company_notifications FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = company_notifications.company_id AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Company owners can delete own notifications"
ON public.company_notifications FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = company_notifications.company_id AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all notifications"
ON public.company_notifications FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow system/admin inserts
CREATE POLICY "Admins can insert notifications"
ON public.company_notifications FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert notifications (for public inquiries)
CREATE POLICY "Anyone can insert notifications"
ON public.company_notifications FOR INSERT
WITH CHECK (true);

-- Company inbox: property requests, inquiries, messages from public users
CREATE TABLE public.company_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  inbox_type text NOT NULL DEFAULT 'inquiry',
  full_name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT NULL,
  message text DEFAULT NULL,
  budget text DEFAULT NULL,
  property_id uuid DEFAULT NULL REFERENCES public.properties(id) ON DELETE SET NULL,
  project_id uuid DEFAULT NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  is_seen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can view own inbox"
ON public.company_inbox FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = company_inbox.company_id AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Company owners can update own inbox"
ON public.company_inbox FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = company_inbox.company_id AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Company owners can delete own inbox"
ON public.company_inbox FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = company_inbox.company_id AND companies.owner_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all inbox"
ON public.company_inbox FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public users can submit inquiries/messages/property requests
CREATE POLICY "Anyone can submit inbox items"
ON public.company_inbox FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_inbox;
