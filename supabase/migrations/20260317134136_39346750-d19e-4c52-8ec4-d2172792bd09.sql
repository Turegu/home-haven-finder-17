
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  template_name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active email templates"
  ON public.email_templates FOR SELECT
  TO public
  USING (is_active = true);

-- Seed default templates
INSERT INTO public.email_templates (template_key, template_name, subject, body_fields) VALUES
(
  'confirmation',
  'Email Confirmation',
  'Verify your email — Turegu',
  '{"greeting":"Hi {{name}}!","body":"You are almost ready to start exploring Turegu.\n\nSimply click the orange button below to verify your email address.","button_text":"Verify Email","footer_note":"If you didn''t create an account with Turegu, you can safely ignore this email."}'::jsonb
),
(
  'welcome',
  'Welcome',
  'Welcome to Turegu!',
  '{"greeting":"Welcome {{name}}!","body":"Thank you for registering a new account with us. Your account is successfully activated and you''ll be able to:","features":["Save Properties & searches","Compare between your favourite Properties","Follow your favourite agents & stay updated with new offers","Sync your activity across all of your devices"],"button_text":"Start Exploring"}'::jsonb
),
(
  'reset',
  'Password Reset',
  'Reset your password — Turegu',
  '{"greeting":"Hi {{name}},","body":"We have received a request to reset your Turegu account password.\n\nIf you did not make this request, you can safely ignore this email and your account details will remain unchanged.","button_text":"Reset Password","help_text":"If you have any questions, please feel free to contact us any time."}'::jsonb
),
(
  'notification',
  'New Listing Notification',
  'New listing from {{publisher_name}} — Turegu',
  '{"greeting":"Hi {{name}}!","body":"{{publisher_name}} has added a new {{listing_type}}:","button_text":"View {{listing_type}}"}'::jsonb
),
(
  'message',
  'Message Notification',
  'Message — Reference {{reference_id}} — Turegu',
  '{"title":"A Message","intro":"{{sender_name}} sent you a message.","reply_note":"You can reply to the sender directly."}'::jsonb
),
(
  'inquiry',
  'Listing Inquiry',
  'Inquiry — Reference {{reference_id}} — Turegu',
  '{"title":"Listing Inquiry","intro":"{{sender_name}} sent you an email inquiry for your property listing with Reference {{reference_id}}.","reply_note":"You can reply to the sender directly."}'::jsonb
);
