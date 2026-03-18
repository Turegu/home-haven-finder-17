
-- Add preference columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS preferred_area_unit text DEFAULT 'm²';

-- Update handle_new_user to populate first/last name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Agent followers
CREATE TABLE IF NOT EXISTS public.agent_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, user_id)
);
ALTER TABLE public.agent_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can follow agents" ON public.agent_followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow agents" ON public.agent_followers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own agent follows" ON public.agent_followers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Agents can view own followers" ON public.agent_followers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.agents WHERE agents.id = agent_followers.agent_id AND agents.user_id = auth.uid()));
CREATE POLICY "Admins can manage agent followers" ON public.agent_followers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Company owners view agent followers" ON public.agent_followers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.agents a JOIN public.companies c ON c.id = a.company_id WHERE a.id = agent_followers.agent_id AND c.owner_user_id = auth.uid()));

-- Saved properties
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved properties" ON public.saved_properties FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Saved searches
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  search_type text NOT NULL DEFAULT 'property',
  search_params jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved searches" ON public.saved_searches FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Property comparisons
CREATE TABLE IF NOT EXISTS public.property_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);
ALTER TABLE public.property_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own comparisons" ON public.property_comparisons FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  notification_type text NOT NULL DEFAULT 'general',
  source_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  source_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert user notifications" ON public.user_notifications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can manage all user notifications" ON public.user_notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User inquiries (contacted properties/messages)
CREATE TABLE IF NOT EXISTS public.user_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  inquiry_type text NOT NULL DEFAULT 'property',
  message text,
  email text,
  phone text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inquiries" ON public.user_inquiries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create inquiries" ON public.user_inquiries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all inquiries" ON public.user_inquiries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
