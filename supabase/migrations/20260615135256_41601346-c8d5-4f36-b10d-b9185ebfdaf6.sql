-- Articles submitted by the public for a National Legend page.
-- Flow: user submits -> admin reviews & sets price -> user pays -> admin approves -> shown publicly.

CREATE TABLE public.legend_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legend_id uuid NOT NULL REFERENCES public.national_legends(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  source_url text,
  price_amount integer NOT NULL DEFAULT 0,
  payment_reference text,
  status text NOT NULL DEFAULT 'pending_review',
  admin_notes text,
  rejection_reason text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.legend_articles TO authenticated;
GRANT SELECT, INSERT ON public.legend_articles TO anon;
GRANT ALL ON public.legend_articles TO service_role;

ALTER TABLE public.legend_articles ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests) can submit an article
CREATE POLICY "Anyone can submit an article"
ON public.legend_articles FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending_review');

-- Public can read only approved articles
CREATE POLICY "Public reads approved articles"
ON public.legend_articles FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Submitter can read their own articles (any status)
CREATE POLICY "Submitter reads own articles"
ON public.legend_articles FOR SELECT
TO authenticated
USING (submitted_by = auth.uid());

-- Admins can read/update everything
CREATE POLICY "Admins read all articles"
ON public.legend_articles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update articles"
ON public.legend_articles FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_legend_articles_updated_at
BEFORE UPDATE ON public.legend_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_legend_articles_legend ON public.legend_articles(legend_id, status);
CREATE INDEX idx_legend_articles_submitter ON public.legend_articles(submitted_by);