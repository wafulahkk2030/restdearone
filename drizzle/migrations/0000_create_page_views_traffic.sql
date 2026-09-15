CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  page_title text,
  referrer text,
  referrer_source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  session_id text,
  user_id uuid,
  device_type text,
  browser text,
  screen_width int,
  language text,
  timezone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_idx ON public.page_views (path);
CREATE INDEX IF NOT EXISTS page_views_session_idx ON public.page_views (session_id);

GRANT INSERT ON public.page_views TO anon;
GRANT INSERT, SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can record a page view" ON public.page_views;
CREATE POLICY "Anyone can record a page view"
ON public.page_views FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read page views" ON public.page_views;
CREATE POLICY "Admins can read page views"
ON public.page_views FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'platform_admin'));