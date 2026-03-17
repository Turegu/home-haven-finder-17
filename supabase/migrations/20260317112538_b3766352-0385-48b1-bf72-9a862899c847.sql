
-- Add phone and show_phone to profiles for follower contact visibility
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT false;

-- Create company_followers table
CREATE TABLE public.company_followers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

ALTER TABLE public.company_followers ENABLE ROW LEVEL SECURITY;

-- Company owners can view their followers
CREATE POLICY "Company owners can view own followers"
ON public.company_followers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_followers.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

-- Admins can manage all followers
CREATE POLICY "Admins can manage followers"
ON public.company_followers FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can follow/unfollow (insert/delete own rows)
CREATE POLICY "Users can follow companies"
ON public.company_followers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow companies"
ON public.company_followers FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Users can see their own follows
CREATE POLICY "Users can view own follows"
ON public.company_followers FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Create company_announcements table for mass messages
CREATE TABLE public.company_announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  announcement_type text NOT NULL DEFAULT 'general',
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.company_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can manage own announcements"
ON public.company_announcements FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_announcements.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all announcements"
ON public.company_announcements FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Followers can view announcements for companies they follow
CREATE POLICY "Followers can view announcements"
ON public.company_announcements FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_followers
    WHERE company_followers.company_id = company_announcements.company_id
    AND company_followers.user_id = auth.uid()
  )
);

-- Create user_announcements junction for tracking read status
CREATE TABLE public.user_announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id uuid NOT NULL REFERENCES public.company_announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE public.user_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own announcements"
ON public.user_announcements FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Company owners can insert announcements for followers"
ON public.user_announcements FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM company_announcements ca
    JOIN companies c ON c.id = ca.company_id
    WHERE ca.id = user_announcements.announcement_id
    AND c.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all user announcements"
ON public.user_announcements FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
