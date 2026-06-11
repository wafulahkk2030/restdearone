-- Rebuild full schema on new Cloud database (replay of project migration history)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

CREATE TYPE public.app_role AS ENUM ('super_admin', 'platform_admin', 'community_moderator', 'memorial_moderator', 'support_admin');
CREATE TYPE public.memorial_status AS ENUM ('active', 'inactive', 'community');
CREATE TYPE public.story_type AS ENUM ('memory', 'lesson', 'letter', 'reflection');
CREATE TYPE public.reaction_type AS ENUM ('touched_me', 'relate_to_this', 'thank_you_for_sharing');
CREATE TYPE public.forum_category AS ENUM ('losing_a_parent', 'losing_a_friend', 'community_heroes', 'life_lessons', 'remembering_teachers', 'celebrating_life');
CREATE TYPE public.report_status AS ENUM ('pending', 'under_review', 'resolved', 'dismissed');
CREATE TYPE public.suspension_type AS ENUM ('temporary', 'permanent');
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Public profiles readable" ON public.profiles FOR SELECT TO anon USING (true);
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  )
$$;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TABLE public.memorial_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  death_year INTEGER NOT NULL,
  relationship_to_creator TEXT NOT NULL,
  personality_summary TEXT,
  unforgettable_moment TEXT,
  common_phrase TEXT,
  life_lesson TEXT,
  what_to_remember TEXT,
  status memorial_status NOT NULL DEFAULT 'inactive',
  activation_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.memorial_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view memorial pages" ON public.memorial_pages FOR SELECT USING (true);
CREATE POLICY "Auth users can create memorial pages" ON public.memorial_pages FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators can update own pages" ON public.memorial_pages FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can manage all pages" ON public.memorial_pages FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE TABLE public.memorial_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memorial_id UUID REFERENCES public.memorial_pages(id) ON DELETE CASCADE NOT NULL,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, memorial_id)
);
ALTER TABLE public.memorial_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view followers" ON public.memorial_followers FOR SELECT USING (true);
CREATE POLICY "Auth users can follow" ON public.memorial_followers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unfollow" ON public.memorial_followers FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES public.memorial_pages(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  story_type story_type NOT NULL DEFAULT 'memory',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Auth users can post stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update own stories" ON public.stories FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Authors can delete own stories" ON public.stories FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Admins can manage stories" ON public.stories FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE TABLE public.story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id, reaction_type)
);
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reactions" ON public.story_reactions FOR SELECT USING (true);
CREATE POLICY "Auth users can react" ON public.story_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove reactions" ON public.story_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.story_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment" ON public.story_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can delete own comments" ON public.story_comments FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE TABLE public.memory_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.memory_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prompts" ON public.memory_prompts FOR SELECT USING (true);
CREATE POLICY "Admins can manage prompts" ON public.memory_prompts FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE TABLE public.prompt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.memory_prompts(id) ON DELETE CASCADE NOT NULL,
  memorial_id UUID REFERENCES public.memorial_pages(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prompt_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prompt responses" ON public.prompt_responses FOR SELECT USING (true);
CREATE POLICY "Auth users can respond" ON public.prompt_responses FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE TABLE public.memory_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES public.memorial_pages(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  UNIQUE (memorial_id, keyword)
);
ALTER TABLE public.memory_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view keywords" ON public.memory_keywords FOR SELECT USING (true);
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memorial_id UUID REFERENCES public.memorial_pages(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL DEFAULT 25000,
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category forum_category NOT NULL DEFAULT 'life_lessons',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view forum posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Auth users can post in forum" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update forum posts" ON public.forum_posts FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE TABLE public.forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view forum comments" ON public.forum_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment in forum" ON public.forum_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  reported_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());
CREATE POLICY "Admins can view reports" ON public.reports FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TABLE public.user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  warning_reason TEXT NOT NULL,
  issued_by_admin UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage warnings" ON public.user_warnings FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own warnings" ON public.user_warnings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.user_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  suspended_by UUID REFERENCES auth.users(id) NOT NULL,
  suspension_type suspension_type NOT NULL DEFAULT 'temporary',
  suspension_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage suspensions" ON public.user_suspensions FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own suspensions" ON public.user_suspensions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view logs" ON public.admin_activity_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can create logs" ON public.admin_activity_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
INSERT INTO public.memory_prompts (prompt_text) VALUES
  ('What made them laugh the most?'),
  ('What was their favorite saying?'),
  ('What habit defined them?'),
  ('What lesson did they teach you?'),
  ('What food did they love?'),
  ('What was their dream?'),
  ('What small thing did they always do for others?'),
  ('What was their favorite place?'),
  ('What song reminds you of them?'),
  ('What would they say if they saw you today?');
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'collinswafulahkk2030@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_on_signup();
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('super_admin', 'platform_admin', 'community_moderator', 'memorial_moderator', 'support_admin')
  )
$$;
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, username, display_name, avatar_url, bio, country, city, created_at
FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS edit_count integer NOT NULL DEFAULT 0;
DROP POLICY IF EXISTS "Authors can update own stories" ON public.stories;
CREATE POLICY "Authors can update own stories" ON public.stories
FOR UPDATE TO authenticated
USING (author_id = auth.uid() AND edit_count < 2)
WITH CHECK (author_id = auth.uid());
CREATE TABLE IF NOT EXISTS public.community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'life_lessons',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_questions jsonb DEFAULT '[]'::jsonb,
  member_count integer NOT NULL DEFAULT 0,
  story_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  price_kes integer NOT NULL DEFAULT 500,
  price_usd numeric(10,2) NOT NULL DEFAULT 5.00,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view communities" ON public.community_groups
FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can create communities" ON public.community_groups
FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators can update own communities" ON public.community_groups
FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Super admin can manage all communities" ON public.community_groups
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  onboarding_answers jsonb DEFAULT '{}'::jsonb,
  ai_engagement_score numeric(5,2) DEFAULT 0,
  stories_posted integer NOT NULL DEFAULT 0,
  last_active_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view members" ON public.community_members
FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can join" ON public.community_members
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own membership" ON public.community_members
FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Community admins can manage members" ON public.community_members
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = community_id AND created_by = auth.uid()
  )
);
CREATE POLICY "Super admin can manage all members" ON public.community_members
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TABLE IF NOT EXISTS public.community_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  payment_reference text,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own community payments" ON public.community_payments
FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create community payments" ON public.community_payments
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all community payments" ON public.community_payments
FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE TABLE IF NOT EXISTS public.community_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  story_type text NOT NULL DEFAULT 'memory',
  edit_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view community stories" ON public.community_stories
FOR SELECT TO public USING (true);
CREATE POLICY "Members can post stories" ON public.community_stories
FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update own community stories" ON public.community_stories
FOR UPDATE TO authenticated USING (author_id = auth.uid() AND edit_count < 2);
CREATE POLICY "Super admin can manage all community stories" ON public.community_stories
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TABLE IF NOT EXISTS public.content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  user_id uuid,
  flag_reason text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  reviewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only super admin can view flags" ON public.content_flags
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System can insert flags" ON public.content_flags
FOR INSERT TO authenticated WITH CHECK (true);
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT id, username, display_name, avatar_url, bio, country, city, created_at
FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;
DROP POLICY IF EXISTS "System can insert flags" ON public.content_flags;
CREATE POLICY "Admins can insert flags" ON public.content_flags
FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
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
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
ALTER TABLE public.stories DROP CONSTRAINT stories_author_id_fkey;
ALTER TABLE public.story_comments DROP CONSTRAINT story_comments_author_id_fkey;
ALTER TABLE public.prompt_responses DROP CONSTRAINT prompt_responses_author_id_fkey;
ALTER TABLE public.forum_posts DROP CONSTRAINT forum_posts_author_id_fkey;
ALTER TABLE public.forum_comments DROP CONSTRAINT forum_comments_author_id_fkey;
ALTER TABLE public.community_stories DROP CONSTRAINT community_stories_author_id_fkey;
ALTER TABLE public.stories ADD CONSTRAINT stories_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.story_comments ADD CONSTRAINT story_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.prompt_responses ADD CONSTRAINT prompt_responses_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.forum_comments ADD CONSTRAINT forum_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.community_stories ADD CONSTRAINT community_stories_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
CREATE POLICY "Admins can manage forum posts"
ON public.forum_posts FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage forum comments"
ON public.forum_comments FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage story comments"
ON public.story_comments FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage invites"
ON public.invites FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage community payments"
ON public.community_payments FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage payments"
ON public.payments FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage content flags"
ON public.content_flags FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage followers"
ON public.memorial_followers FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage keywords"
ON public.memory_keywords FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage reactions"
ON public.story_reactions FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage prompt responses"
ON public.prompt_responses FOR ALL TO authenticated
USING (is_admin(auth.uid()));
CREATE TABLE public.flower_tributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES public.memorial_pages(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  sender_name text NOT NULL,
  flower_type text NOT NULL,
  tribute_value integer NOT NULL,
  tribute_note text,
  payment_reference text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.flower_tributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tributes" ON public.flower_tributes FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can create tributes" ON public.flower_tributes FOR INSERT TO authenticated WITH CHECK (sender_user_id = auth.uid());
CREATE POLICY "Admins can manage tributes" ON public.flower_tributes FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY "Authenticated can insert notifications" ON notifications;
CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Authors can delete own forum posts"
  ON forum_posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());
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
CREATE INDEX idx_contributions_fundraiser ON public.contributions(fundraiser_id);
CREATE INDEX idx_fundraiser_deadline ON public.fundraisers(deadline);
CREATE INDEX idx_chat_messages_chat ON public.chat_messages(chat_id);
CREATE INDEX idx_chat_members_user ON public.chat_members(user_id);
ALTER TABLE public.fundraisers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view fundraisers" ON public.fundraisers FOR SELECT TO public USING (true);
CREATE POLICY "Auth users can create fundraisers" ON public.fundraisers FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators can update own fundraisers" ON public.fundraisers FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Admins can manage all fundraisers" ON public.fundraisers FOR ALL TO authenticated USING (is_admin(auth.uid()));
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can create contributions" ON public.contributions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage contributions" ON public.contributions FOR ALL TO authenticated USING (is_admin(auth.uid()));
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat members can view chats" ON public.chats FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = chats.id AND user_id = auth.uid())
  OR is_admin(auth.uid())
);
CREATE POLICY "Auth users can create chats" ON public.chats FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins can manage chats" ON public.chats FOR ALL TO authenticated USING (is_admin(auth.uid()));
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view chat members" ON public.chat_members FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_members cm WHERE cm.chat_id = chat_members.chat_id AND cm.user_id = auth.uid())
  OR is_admin(auth.uid())
);
CREATE POLICY "Users can leave chats" ON public.chat_members FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage chat members" ON public.chat_members FOR ALL TO authenticated USING (is_admin(auth.uid()));
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
CREATE OR REPLACE FUNCTION public.increment_fundraiser_amount(
  fundraiser_id_input uuid,
  amount_input integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.fundraisers
  SET current_amount = current_amount + amount_input
  WHERE id = fundraiser_id_input;
END;
$$;
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
CREATE POLICY "Anyone can view memorial photos storage" ON storage.objects FOR SELECT USING (bucket_id = 'memorial-photos');
CREATE POLICY "Authenticated users can upload memorial photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'memorial-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own memorial photos" ON storage.objects FOR DELETE USING (bucket_id = 'memorial-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
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
CREATE POLICY "Auth users can request verification" ON public.family_verifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update verifications" ON public.family_verifications
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete verifications" ON public.family_verifications
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));
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
ALTER TABLE public.contributions
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS note_to_family text;
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
CREATE POLICY "Owners and admins can delete fundraiser images"
  ON public.fundraiser_images FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.fundraisers WHERE id = fundraiser_images.fundraiser_id AND created_by = auth.uid())
    OR is_admin(auth.uid())
  );
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
CREATE POLICY "Anyone can view fundraiser images storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fundraiser-images');
CREATE POLICY "Auth users can upload fundraiser images storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fundraiser-images');
CREATE POLICY "Users can delete own fundraiser images storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fundraiser-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE INDEX IF NOT EXISTS idx_fundraisers_short_id ON public.fundraisers(short_id);
CREATE INDEX IF NOT EXISTS idx_fundraiser_link_clicks_fundraiser ON public.fundraiser_link_clicks(fundraiser_id);
CREATE TABLE IF NOT EXISTS public.fundraiser_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL UNIQUE,
  payout_method TEXT,
  payout_account TEXT,
  payout_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fundraiser_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view own payout"
ON public.fundraiser_payouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fundraisers f
    WHERE f.id = fundraiser_payouts.fundraiser_id
      AND f.created_by = auth.uid()
  )
);
CREATE POLICY "Owners can insert own payout"
ON public.fundraiser_payouts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fundraisers f
    WHERE f.id = fundraiser_payouts.fundraiser_id
      AND f.created_by = auth.uid()
  )
);
CREATE POLICY "Owners can update own payout"
ON public.fundraiser_payouts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fundraisers f
    WHERE f.id = fundraiser_payouts.fundraiser_id
      AND f.created_by = auth.uid()
  )
);
CREATE POLICY "Admins manage all payouts"
ON public.fundraiser_payouts
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
CREATE OR REPLACE FUNCTION public.update_fundraiser_payouts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_fundraiser_payouts_updated_at ON public.fundraiser_payouts;
CREATE TRIGGER trg_fundraiser_payouts_updated_at
BEFORE UPDATE ON public.fundraiser_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_fundraiser_payouts_updated_at();
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  user_id UUID,
  source TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_security_events_created_at ON public.security_events (created_at DESC);
CREATE INDEX idx_security_events_event_type ON public.security_events (event_type);
CREATE INDEX idx_security_events_user_id ON public.security_events (user_id);
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert own security events"
ON public.security_events
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can update own membership" ON public.community_members;
CREATE POLICY "Users can update own membership"
  ON public.community_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND role = (SELECT cm.role FROM public.community_members cm WHERE cm.id = community_members.id)
  );
DROP POLICY IF EXISTS "Anyone can view members" ON public.community_members;
CREATE POLICY "Members and admins can view community members"
  ON public.community_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_members me
      WHERE me.community_id = community_members.community_id
        AND me.user_id = auth.uid()
        AND me.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.community_groups g
      WHERE g.id = community_members.community_id AND g.created_by = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );
CREATE OR REPLACE VIEW public.public_community_members AS
SELECT id, community_id, user_id, role, status, joined_at
FROM public.community_members
WHERE status = 'active';
GRANT SELECT ON public.public_community_members TO anon, authenticated;
CREATE POLICY "Owner and admins can view verifications"
  ON public.family_verifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE OR REPLACE VIEW public.public_family_verifications AS
SELECT id, memorial_id, user_id, relationship, status, created_at
FROM public.family_verifications
WHERE status = 'verified';
GRANT SELECT ON public.public_family_verifications TO anon, authenticated;
CREATE OR REPLACE VIEW public.public_contributions AS
SELECT
  id,
  fundraiser_id,
  CASE WHEN is_anonymous THEN NULL ELSE donor_name END AS donor_name,
  gross_amount,
  CASE WHEN is_anonymous THEN NULL ELSE note_to_family END AS note_to_family,
  is_anonymous,
  payment_status,
  created_at
FROM public.contributions
WHERE payment_status = 'success';
GRANT SELECT ON public.public_contributions TO anon, authenticated;
CREATE OR REPLACE VIEW public.public_fundraisers AS
SELECT
  id, title, description, target_amount, current_amount,
  created_by, status, created_at, slug, short_id,
  relationship_to_deceased, personal_statement, memorial_id,
  highlight_until, highlight_tier, deadline
FROM public.fundraisers
WHERE status IN ('active', 'completed', 'approved');
GRANT SELECT ON public.public_fundraisers TO anon, authenticated;
DROP POLICY IF EXISTS "Users can update own memorial photos" ON storage.objects;
CREATE POLICY "Users can update own memorial photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'memorial-photos' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'memorial-photos' AND owner = auth.uid());
DROP POLICY IF EXISTS "Users can update own fundraiser images" ON storage.objects;
CREATE POLICY "Users can update own fundraiser images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'fundraiser-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'fundraiser-images' AND owner = auth.uid());
REVOKE EXECUTE ON FUNCTION public.increment_fundraiser_amount(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_fundraiser_amount(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_fundraiser_amount(uuid, integer) FROM authenticated;
REVOKE SELECT ON public.fundraisers FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, title, description, target_amount, current_amount,
  created_by, status, created_at, slug, short_id,
  relationship_to_deceased, personal_statement,
  memorial_id, highlight_until, highlight_tier, deadline
) ON public.fundraisers TO anon, authenticated;
REVOKE SELECT ON public.contributions FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, fundraiser_id, gross_amount, platform_fee, net_amount,
  is_anonymous, payment_status, created_at
) ON public.contributions TO anon, authenticated;
ALTER VIEW IF EXISTS public.public_profiles SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_community_members SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_family_verifications SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_contributions SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_fundraisers SET (security_invoker = true);
DROP POLICY IF EXISTS "Anyone can view community stories" ON public.community_stories;
CREATE POLICY "Members admins creators can view community stories"
ON public.community_stories
FOR SELECT
TO authenticated
USING (
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_stories.community_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = community_stories.community_id
      AND g.created_by = auth.uid()
  )
  OR public.is_admin(auth.uid())
);
REVOKE SELECT (payment_reference) ON public.flower_tributes FROM anon, authenticated;
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can subscribe to own chats" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe to own chats"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  (
    realtime.topic() LIKE 'chat:%'
    AND EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.chat_id::text = split_part(realtime.topic(), ':', 2)
        AND cm.user_id = auth.uid()
    )
  )
  OR (
    realtime.topic() LIKE 'user:%'
    AND split_part(realtime.topic(), ':', 2) = auth.uid()::text
  )
  OR realtime.topic() LIKE 'public:%'
);
ALTER TABLE public.fundraisers DROP COLUMN IF EXISTS payout_method;
ALTER TABLE public.fundraisers DROP COLUMN IF EXISTS payout_details;
ALTER TABLE public.fundraisers DROP COLUMN IF EXISTS payout_account;
DROP POLICY IF EXISTS "Members can post stories" ON public.community_stories;
CREATE POLICY "Members can post stories"
ON public.community_stories
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_stories.community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.community_groups g
      WHERE g.id = community_stories.community_id
        AND g.created_by = auth.uid()
    )
    OR public.is_admin(auth.uid())
  )
);
DROP POLICY IF EXISTS "Auth users can join" ON public.community_members;
CREATE POLICY "Auth users can join"
ON public.community_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.community_groups g
      WHERE g.id = community_members.community_id
        AND g.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.community_payments cp
      WHERE cp.community_id = community_members.community_id
        AND cp.user_id = auth.uid()
        AND cp.status = 'completed'
        AND (cp.expires_at IS NULL OR cp.expires_at > now())
    )
    OR public.is_admin(auth.uid())
  )
);
CREATE POLICY "Contribution visibility scoped"
ON public.contributions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR (
    is_anonymous = false
    AND EXISTS (
      SELECT 1 FROM public.fundraisers f
      WHERE f.id = contributions.fundraiser_id AND f.created_by = auth.uid()
    )
  )
);
CREATE POLICY "Public can view fundraisers"
ON public.fundraisers FOR SELECT
TO anon, authenticated
USING (true);
GRANT SELECT (admin_notes, rejection_reason) ON public.fundraisers TO service_role;
CREATE POLICY "Creator or admin can view invites"
ON public.invites FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view invites" ON public.invites;
CREATE POLICY "Owners or admins can upload fundraiser images"
ON public.fundraiser_images FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.fundraisers f WHERE f.id = fundraiser_images.fundraiser_id AND f.created_by = auth.uid())
    OR is_admin(auth.uid())
  )
);
ALTER TABLE public.flower_tributes ALTER COLUMN sender_user_id DROP NOT NULL;
ALTER TABLE public.flower_tributes ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE public.contributions ADD COLUMN IF NOT EXISTS donor_email TEXT;
REVOKE SELECT (sender_email) ON public.flower_tributes FROM anon, authenticated;
GRANT SELECT (sender_email) ON public.flower_tributes TO service_role;
REVOKE SELECT (donor_email) ON public.contributions FROM anon, authenticated;
GRANT SELECT (donor_email, user_id) ON public.contributions TO service_role;
CREATE POLICY "Auth users can join chats"
ON public.chat_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_members.chat_id
        AND (
          c.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.memorial_pages m
            WHERE m.id = c.memorial_id AND m.created_by = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.community_members cm
            WHERE cm.community_id = c.community_id
              AND cm.user_id = auth.uid()
              AND cm.status = 'active'
          )
          OR EXISTS (
            SELECT 1 FROM public.community_groups g
            WHERE g.id = c.community_id AND g.created_by = auth.uid()
          )
        )
    )
  )
);
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
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
REVOKE SELECT (contributor_email) ON public.legend_contributions FROM anon, authenticated;
REVOKE SELECT (donor_email, payment_reference, gross_amount, net_amount, platform_fee)
  ON public.contributions FROM anon, authenticated;
REVOKE SELECT (user_id) ON public.memorial_followers FROM anon;
REVOKE SELECT (user_id) ON public.story_reactions FROM anon;
REVOKE SELECT (onboarding_answers) ON public.community_members FROM anon, authenticated;