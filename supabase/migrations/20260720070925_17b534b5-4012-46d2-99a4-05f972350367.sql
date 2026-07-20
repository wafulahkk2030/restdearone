
CREATE TABLE IF NOT EXISTS public.site_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  payments_enabled BOOLEAN NOT NULL DEFAULT true,
  signups_enabled BOOLEAN NOT NULL DEFAULT true,
  memorial_creation_enabled BOOLEAN NOT NULL DEFAULT true,
  story_creation_enabled BOOLEAN NOT NULL DEFAULT true,
  community_creation_enabled BOOLEAN NOT NULL DEFAULT true,
  fundraiser_creation_enabled BOOLEAN NOT NULL DEFAULT true,
  chat_enabled BOOLEAN NOT NULL DEFAULT true,
  comments_enabled BOOLEAN NOT NULL DEFAULT true,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT,
  banner_message TEXT,
  banner_active BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = true)
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Only top admins can update settings" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin'));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
