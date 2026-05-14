-- Helper function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DELETE FROM public.memory_keywords;

CREATE TABLE public.national_legends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  slug text UNIQUE,
  title text,
  birth_year integer,
  death_year integer NOT NULL,
  date_of_death date,
  cause_of_death text,
  location text,
  national_impact_summary text,
  biography text,
  quotes jsonb DEFAULT '[]'::jsonb,
  partner_organizations jsonb DEFAULT '[]'::jsonb,
  banner_image_url text,
  gallery_images jsonb DEFAULT '[]'::jsonb,
  video_embed_url text,
  tribute_target_amount integer DEFAULT 0,
  current_tribute_amount integer DEFAULT 0,
  fundraising_target_amount integer DEFAULT 0,
  current_fundraising_amount integer DEFAULT 0,
  flower_price_tier text DEFAULT 'standard',
  flower_min_amount integer DEFAULT 100,
  status text NOT NULL DEFAULT 'pending',
  is_official boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'public',
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  admin_notes text,
  submitted_by uuid,
  view_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.national_legends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved legends" ON public.national_legends FOR SELECT USING (status = 'approved' AND visibility = 'public');
CREATE POLICY "Admins can view all legends" ON public.national_legends FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Submitter can view own submission" ON public.national_legends FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "Auth users can submit legends" ON public.national_legends FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid() AND status = 'pending');
CREATE POLICY "Admins can manage all legends" ON public.national_legends FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE TRIGGER update_national_legends_updated_at BEFORE UPDATE ON public.national_legends FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.legend_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legend_id uuid NOT NULL REFERENCES public.national_legends(id) ON DELETE CASCADE,
  contributor_user_id uuid,
  contributor_name text NOT NULL DEFAULT 'Anonymous',
  contributor_email text,
  contribution_type text NOT NULL DEFAULT 'tribute',
  amount integer NOT NULL,
  message text,
  payment_reference text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.legend_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view completed legend contributions" ON public.legend_contributions FOR SELECT USING (status = 'completed');
CREATE POLICY "Admins manage legend contributions" ON public.legend_contributions FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Anyone can create legend contribution" ON public.legend_contributions FOR INSERT WITH CHECK (true);

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  source text DEFAULT 'popup',
  user_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins manage subscribers" ON public.newsletter_subscribers FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_legends_status ON public.national_legends(status);
CREATE INDEX idx_legend_contributions_legend ON public.legend_contributions(legend_id);
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);