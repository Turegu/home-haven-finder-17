
-- =============================================
-- 1. Fix company_notifications: Remove public INSERT
-- =============================================
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.company_notifications;

-- Create an insert_company_notification RPC for system use
CREATE OR REPLACE FUNCTION public.insert_company_notification(
  p_company_id uuid,
  p_title text,
  p_message text DEFAULT NULL,
  p_notification_type text DEFAULT 'system',
  p_posted_by text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.company_notifications (company_id, title, message, notification_type, posted_by)
  VALUES (p_company_id, p_title, p_message, p_notification_type, p_posted_by)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 2. Fix email_templates: Remove public SELECT, admin-only
DROP POLICY IF EXISTS "Anyone can view active email templates" ON public.email_templates;

-- 3. Fix realtime: Remove company_notifications from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.company_notifications;

-- 4. Fix storage: Replace overly permissive policies with ownership-checked policies
-- The upload path pattern is: {companyId}/... so we use (storage.foldername(name))[1] as company_id

-- Property Images
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete property images" ON storage.objects;

CREATE POLICY "Company owners can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

CREATE POLICY "Company owners can delete property images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

-- Property Plans
DROP POLICY IF EXISTS "Authenticated users can upload property plans" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete property plans" ON storage.objects;

CREATE POLICY "Company owners can upload property plans"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-plans'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

CREATE POLICY "Company owners can delete property plans"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-plans'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

-- Project Images
DROP POLICY IF EXISTS "Auth users can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete project images" ON storage.objects;

CREATE POLICY "Company owners can upload project images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-images'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

CREATE POLICY "Company owners can delete project images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-images'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

-- Project Plans
DROP POLICY IF EXISTS "Auth users can upload project plans" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete project plans" ON storage.objects;

CREATE POLICY "Company owners can upload project plans"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-plans'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

CREATE POLICY "Company owners can delete project plans"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-plans'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

-- Project Catalogues
DROP POLICY IF EXISTS "Auth users can upload project catalogues" ON storage.objects;

CREATE POLICY "Company owners can upload project catalogues"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-catalogues'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

-- Project Logos
DROP POLICY IF EXISTS "Auth users can upload project logos" ON storage.objects;

CREATE POLICY "Company owners can upload project logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-logos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

-- Event Images
DROP POLICY IF EXISTS "Company owners can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Company owners can delete event images" ON storage.objects;

CREATE POLICY "Verified owners can upload event images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

CREATE POLICY "Verified owners can delete event images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-images'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

-- Agent Avatars
DROP POLICY IF EXISTS "Authenticated can upload agent avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete agent avatars" ON storage.objects;

CREATE POLICY "Agent owners can upload agent avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'agent-avatars'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);

CREATE POLICY "Agent owners can delete agent avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'agent-avatars'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.owner_user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM agents a WHERE a.company_id = c.id AND a.user_id = auth.uid()
        ))
    )
  )
);
