
-- Property requests table to store user property requirement submissions
CREATE TABLE public.property_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  contact_method text NOT NULL DEFAULT 'Phone',
  enquiry_type text NOT NULL DEFAULT 'residential_buy',
  property_type text,
  province text,
  district text,
  neighbourhood text,
  area_street text,
  budget text,
  area_sqm text,
  rooms text,
  bathrooms text,
  furnishing text,
  floor_level text,
  property_status text,
  parking_space text,
  view_orientation text,
  interior_amenities text[] DEFAULT '{}',
  exterior_amenities text[] DEFAULT '{}',
  additional_requests text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a property request (even anonymous)
CREATE POLICY "Anyone can submit property requests"
ON public.property_requests FOR INSERT
TO public
WITH CHECK (true);

-- Authenticated users can view own requests
CREATE POLICY "Users can view own requests"
ON public.property_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all requests
CREATE POLICY "Admins can manage all property requests"
ON public.property_requests FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Companies with plus/pro membership can view requests
CREATE POLICY "Plus and Pro companies can view property requests"
ON public.property_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.owner_user_id = auth.uid()
      AND companies.membership IN ('plus', 'pro')
      AND companies.is_verified = true
  )
);
