-- Allow company owners to delete user_announcements for their announcements (recall)
CREATE POLICY "Company owners can delete announcements for followers"
ON public.user_announcements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_announcements ca
    JOIN companies c ON c.id = ca.company_id
    WHERE ca.id = user_announcements.announcement_id
    AND c.owner_user_id = auth.uid()
  )
);

-- Allow agents to manage announcements for their company
CREATE POLICY "Agents can insert announcements"
ON public.company_announcements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.company_id = company_announcements.company_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Agents can view own company announcements"
ON public.company_announcements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.company_id = company_announcements.company_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Agents can update own company announcements"
ON public.company_announcements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.company_id = company_announcements.company_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Agents can delete own company announcements"
ON public.company_announcements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.company_id = company_announcements.company_id
    AND a.user_id = auth.uid()
  )
);

-- Allow agents to delete user_announcements for recall
CREATE POLICY "Agents can delete user announcements for recall"
ON public.user_announcements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_announcements ca
    JOIN agents a ON a.company_id = ca.company_id
    WHERE ca.id = user_announcements.announcement_id
    AND a.user_id = auth.uid()
  )
);

-- Allow agents to insert user_announcements
CREATE POLICY "Agents can insert user announcements"
ON public.user_announcements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM company_announcements ca
    JOIN agents a ON a.company_id = ca.company_id
    WHERE ca.id = user_announcements.announcement_id
    AND a.user_id = auth.uid()
  )
);