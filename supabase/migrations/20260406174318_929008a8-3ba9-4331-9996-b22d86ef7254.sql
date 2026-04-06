
-- Create admin audit log table
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action VARCHAR NOT NULL,
  target_type VARCHAR NOT NULL,
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Security definer function for logging
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action VARCHAR,
  p_target_type VARCHAR,
  p_target_id UUID DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can log actions';
  END IF;

  INSERT INTO public.admin_audit_log (admin_user_id, action, target_type, target_id, old_value, new_value)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_old_value, p_new_value)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Index for faster queries
CREATE INDEX idx_audit_log_created_at ON public.admin_audit_log (created_at DESC);
