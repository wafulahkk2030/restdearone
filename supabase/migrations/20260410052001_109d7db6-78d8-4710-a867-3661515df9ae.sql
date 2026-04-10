
-- Add new columns to fundraisers
ALTER TABLE public.fundraisers 
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS relationship_to_deceased text,
  ADD COLUMN IF NOT EXISTS personal_statement text,
  ADD COLUMN IF NOT EXISTS memorial_id uuid REFERENCES public.memorial_pages(id),
  ADD COLUMN IF NOT EXISTS highlight_until timestamp with time zone,
  ADD COLUMN IF NOT EXISTS highlight_tier text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add new columns to contributions
ALTER TABLE public.contributions
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS note_to_family text;

-- Create fundraiser_images table
CREATE TABLE IF NOT EXISTS public.fundraiser_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  uploaded_by uuid NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fundraiser_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fundraiser images"
  ON public.fundraiser_images FOR SELECT
  USING (true);

CREATE POLICY "Auth users can upload fundraiser images"
  ON public.fundraiser_images FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Owners and admins can delete fundraiser images"
  ON public.fundraiser_images FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.fundraisers WHERE id = fundraiser_images.fundraiser_id AND created_by = auth.uid())
    OR is_admin(auth.uid())
  );

-- Create fundraiser_link_clicks table
CREATE TABLE IF NOT EXISTS public.fundraiser_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  clicked_at timestamp with time zone NOT NULL DEFAULT now(),
  referrer text
);

ALTER TABLE public.fundraiser_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can track clicks"
  ON public.fundraiser_link_clicks FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view click analytics"
  ON public.fundraiser_link_clicks FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- Create storage bucket for fundraiser images
INSERT INTO storage.buckets (id, name, public)
VALUES ('fundraiser-images', 'fundraiser-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view fundraiser images storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fundraiser-images');

CREATE POLICY "Auth users can upload fundraiser images storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fundraiser-images');

CREATE POLICY "Users can delete own fundraiser images storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fundraiser-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Index for quick short_id lookups
CREATE INDEX IF NOT EXISTS idx_fundraisers_short_id ON public.fundraisers(short_id);
CREATE INDEX IF NOT EXISTS idx_fundraiser_link_clicks_fundraiser ON public.fundraiser_link_clicks(fundraiser_id);
