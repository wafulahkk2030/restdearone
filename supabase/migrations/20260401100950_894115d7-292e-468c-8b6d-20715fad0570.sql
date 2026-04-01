
-- Fundraising tables
CREATE TABLE public.fundraisers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  target_amount integer NOT NULL,
  current_amount integer NOT NULL DEFAULT 0,
  deadline timestamptz NOT NULL,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  payout_details jsonb,
  payout_method text,
  payout_account text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid REFERENCES public.fundraisers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  donor_name text,
  gross_amount integer NOT NULL,
  platform_fee integer NOT NULL,
  net_amount integer NOT NULL,
  payment_reference text UNIQUE,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chat tables
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_type text NOT NULL DEFAULT 'group',
  name text,
  memorial_id uuid REFERENCES public.memorial_pages(id) ON DELETE SET NULL,
  community_id uuid REFERENCES public.community_groups(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'memory',
  is_flagged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contributions_fundraiser ON public.contributions(fundraiser_id);
CREATE INDEX idx_fundraiser_deadline ON public.fundraisers(deadline);
CREATE INDEX idx_chat_messages_chat ON public.chat_messages(chat_id);
CREATE INDEX idx_chat_members_user ON public.chat_members(user_id);

-- Atomic increment function for fundraiser
CREATE OR REPLACE FUNCTION public.increment_fundraiser_amount(
  fundraiser_id_input uuid,
  amount_input integer
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.fundraisers
  SET current_amount = current_amount + amount_input
  WHERE id = fundraiser_id_input;
END;
$$;

-- RLS for fundraisers
ALTER TABLE public.fundraisers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view fundraisers" ON public.fundraisers FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can create fundraisers" ON public.fundraisers FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators can update own fundraisers" ON public.fundraisers FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can manage all fundraisers" ON public.fundraisers FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS for contributions
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view contributions" ON public.contributions FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can create contributions" ON public.contributions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage contributions" ON public.contributions FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS for chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat members can view chats" ON public.chats FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = chats.id AND user_id = auth.uid())
  OR is_admin(auth.uid())
);
CREATE POLICY "Auth users can create chats" ON public.chats FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins can manage chats" ON public.chats FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS for chat_members
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view chat members" ON public.chat_members FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_members cm WHERE cm.chat_id = chat_members.chat_id AND cm.user_id = auth.uid())
  OR is_admin(auth.uid())
);
CREATE POLICY "Auth users can join chats" ON public.chat_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave chats" ON public.chat_members FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage chat members" ON public.chat_members FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat members can view messages" ON public.chat_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid())
  OR is_admin(auth.uid())
);
CREATE POLICY "Chat members can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage messages" ON public.chat_messages FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Enable realtime for fundraisers and chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.fundraisers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
