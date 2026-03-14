
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Invites table
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  memorial_id uuid REFERENCES public.memorial_pages(id),
  community_id uuid REFERENCES public.community_groups(id),
  uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invites" ON public.invites FOR SELECT USING (true);
CREATE POLICY "Auth users can create invites" ON public.invites FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators can update invites" ON public.invites FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Add community_groups category to be free-text (already text type, no change needed)
-- Add max_communities setting - we'll track via count queries

-- Make community categories more flexible by adding an "other" category support
-- category is already text type so any value works
