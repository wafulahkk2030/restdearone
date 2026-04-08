
-- Contact submissions table
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions FOR SELECT USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin') OR public.has_role(auth.uid(), 'support_admin'));
CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin') OR public.has_role(auth.uid(), 'support_admin'));
CREATE POLICY "Admins can delete contact submissions" ON public.contact_submissions FOR DELETE USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin'));

-- Memorial journey events table
CREATE TABLE public.memorial_journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES public.memorial_pages(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.memorial_journey_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view journey events" ON public.memorial_journey_events FOR SELECT USING (true);
CREATE POLICY "Owners can manage journey events" ON public.memorial_journey_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.memorial_pages WHERE id = memorial_id AND created_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin')
);
CREATE POLICY "Owners can update journey events" ON public.memorial_journey_events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.memorial_pages WHERE id = memorial_id AND created_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin')
);
CREATE POLICY "Owners can delete journey events" ON public.memorial_journey_events FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.memorial_pages WHERE id = memorial_id AND created_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin')
);

-- Memorial photos table
CREATE TABLE public.memorial_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES public.memorial_pages(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.memorial_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view memorial photos" ON public.memorial_photos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload photos" ON public.memorial_photos FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Owners and admins can delete photos" ON public.memorial_photos FOR DELETE USING (
  uploaded_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.memorial_pages WHERE id = memorial_id AND created_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin')
);

-- Memorial service info table
CREATE TABLE public.memorial_service_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES public.memorial_pages(id) ON DELETE CASCADE NOT NULL UNIQUE,
  service_date DATE,
  service_time TEXT,
  venue_name TEXT,
  venue_address TEXT,
  donation_info TEXT,
  additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.memorial_service_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view service info" ON public.memorial_service_info FOR SELECT USING (true);
CREATE POLICY "Owners can manage service info" ON public.memorial_service_info FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.memorial_pages WHERE id = memorial_id AND created_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin')
);
CREATE POLICY "Owners can update service info" ON public.memorial_service_info FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.memorial_pages WHERE id = memorial_id AND created_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin')
);
CREATE POLICY "Owners can delete service info" ON public.memorial_service_info FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.memorial_pages WHERE id = memorial_id AND created_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin')
);

-- Storage bucket for memorial photos
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('memorial-photos', 'memorial-photos', true, 10485760)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view memorial photos storage" ON storage.objects FOR SELECT USING (bucket_id = 'memorial-photos');
CREATE POLICY "Authenticated users can upload memorial photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'memorial-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own memorial photos" ON storage.objects FOR DELETE USING (bucket_id = 'memorial-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
