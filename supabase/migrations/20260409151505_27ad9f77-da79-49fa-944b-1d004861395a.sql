-- Family Verifications
CREATE TABLE public.family_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memorial_id UUID NOT NULL REFERENCES public.memorial_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  relationship TEXT NOT NULL,
  evidence_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(memorial_id, user_id)
);

ALTER TABLE public.family_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified family" ON public.family_verifications
  FOR SELECT USING (status = 'verified' OR user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Auth users can request verification" ON public.family_verifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update verifications" ON public.family_verifications
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete verifications" ON public.family_verifications
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Media Embeds (YouTube, SoundCloud, etc.)
CREATE TABLE public.media_embeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memorial_id UUID NOT NULL REFERENCES public.memorial_pages(id) ON DELETE CASCADE,
  added_by UUID NOT NULL,
  embed_url TEXT NOT NULL,
  embed_type TEXT NOT NULL DEFAULT 'youtube',
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.media_embeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media embeds" ON public.media_embeds
  FOR SELECT USING (true);

CREATE POLICY "Auth users can add embeds" ON public.media_embeds
  FOR INSERT TO authenticated WITH CHECK (added_by = auth.uid());

CREATE POLICY "Owners and admins can delete embeds" ON public.media_embeds
  FOR DELETE TO authenticated USING (
    added_by = auth.uid() OR
    EXISTS (SELECT 1 FROM memorial_pages WHERE id = media_embeds.memorial_id AND created_by = auth.uid()) OR
    is_admin(auth.uid())
  );