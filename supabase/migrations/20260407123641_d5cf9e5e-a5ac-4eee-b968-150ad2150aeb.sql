-- Allow users to delete their own inquiries
CREATE POLICY "Users can delete own inquiries"
ON public.user_inquiries
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to delete their own property requests
CREATE POLICY "Users can delete own property requests"
ON public.property_requests
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.user_notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());