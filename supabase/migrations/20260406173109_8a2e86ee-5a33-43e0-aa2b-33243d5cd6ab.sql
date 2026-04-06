CREATE POLICY "Anyone can view active properties" ON public.properties FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Anyone can view active projects" ON public.projects FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Anyone can view active events" ON public.events FOR SELECT TO anon, authenticated USING (status = 'active');