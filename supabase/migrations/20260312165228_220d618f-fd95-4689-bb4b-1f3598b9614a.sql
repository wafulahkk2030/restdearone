
-- 1. Create enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'platform_admin', 'community_moderator', 'memorial_moderator', 'support_admin');
CREATE TYPE public.memorial_status AS ENUM ('active', 'inactive', 'community');
CREATE TYPE public.story_type AS ENUM ('memory', 'lesson', 'letter', 'reflection');
CREATE TYPE public.reaction_type AS ENUM ('touched_me', 'relate_to_this', 'thank_you_for_sharing');
CREATE TYPE public.forum_category AS ENUM ('losing_a_parent', 'losing_a_friend', 'community_heroes', 'life_lessons', 'remembering_teachers', 'celebrating_life');
CREATE TYPE public.report_status AS ENUM ('pending', 'under_review', 'resolved', 'dismissed');
CREATE TYPE public.suspension_type AS ENUM ('temporary', 'permanent');

-- 2. Profiles table
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

-- 3. User roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
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

-- 4. Memorial pages
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

-- 5. Memorial followers
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

-- 6. Stories
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

-- 7. Story reactions
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

-- 8. Story comments
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

-- 9. Memory prompts
CREATE TABLE public.memory_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.memory_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prompts" ON public.memory_prompts FOR SELECT USING (true);
CREATE POLICY "Admins can manage prompts" ON public.memory_prompts FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- 10. Prompt responses
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

-- 11. Memory keywords (echo wall)
CREATE TABLE public.memory_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID REFERENCES public.memorial_pages(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  UNIQUE (memorial_id, keyword)
);
ALTER TABLE public.memory_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view keywords" ON public.memory_keywords FOR SELECT USING (true);

-- 12. Payments
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

-- 13. Forum posts
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

-- 14. Forum comments
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

-- 15. Reports (moderation)
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

-- 16. User warnings
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

-- 17. User suspensions
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

-- 18. Admin activity logs
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

-- 19. Trigger to create profile on signup
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

-- 20. Seed memory prompts
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
