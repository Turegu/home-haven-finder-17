-- Allow company owners to delete user_notifications they created via announcements
CREATE POLICY "Company owners can delete announcement notifications"
ON public.user_notifications
FOR DELETE
TO authenticated
USING (
  notification_type = 'announcement'
  AND source_company_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = user_notifications.source_company_id
    AND c.owner_user_id = auth.uid()
  )
);

-- Allow company owners to update announcement notifications (for edits)
CREATE POLICY "Company owners can update announcement notifications"
ON public.user_notifications
FOR UPDATE
TO authenticated
USING (
  notification_type = 'announcement'
  AND source_company_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = user_notifications.source_company_id
    AND c.owner_user_id = auth.uid()
  )
);

-- Same for agents
CREATE POLICY "Agents can delete announcement notifications"
ON public.user_notifications
FOR DELETE
TO authenticated
USING (
  notification_type = 'announcement'
  AND source_company_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM agents a
    WHERE a.company_id = user_notifications.source_company_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Agents can update announcement notifications"
ON public.user_notifications
FOR UPDATE
TO authenticated
USING (
  notification_type = 'announcement'
  AND source_company_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM agents a
    WHERE a.company_id = user_notifications.source_company_id
    AND a.user_id = auth.uid()
  )
);