
-- ============================================================
-- BATCH 4: RLS Policy Hardening
-- ============================================================

-- 1. company_inbox: Remove public INSERT (only SECURITY DEFINER RPCs should insert)
DROP POLICY IF EXISTS "Anyone can submit inbox items" ON public.company_inbox;

-- 2. agents: Remove DELETE policy (soft deactivation only)
DROP POLICY IF EXISTS "Company owners can delete own agents" ON public.agents;

-- 3. properties: Add agent-level policies for own listings
CREATE POLICY "Agents can view own properties"
  ON public.properties FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM agents a
    WHERE a.id = properties.agent_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Agents can insert own properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM agents a
    WHERE a.id = properties.agent_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Agents can update own properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM agents a
    WHERE a.id = properties.agent_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "Agents can delete own properties"
  ON public.properties FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM agents a
    WHERE a.id = properties.agent_id AND a.user_id = auth.uid()
  ));

-- 4. profiles: Restrict SELECT to own profile only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Also allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
