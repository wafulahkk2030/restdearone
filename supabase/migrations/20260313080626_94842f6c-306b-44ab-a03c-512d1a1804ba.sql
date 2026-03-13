
-- 1. Fix is_admin to only check actual admin roles
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

-- 2. Remove anon SELECT policy from profiles and create a public view
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;

-- Create a public-facing view that omits sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, username, display_name, avatar_url, bio, country, city, created_at
FROM public.profiles;

-- Grant anon access to the view
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- 3. Add edit_count to stories (max 2 edits)
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS edit_count integer NOT NULL DEFAULT 0;

-- Update the stories update policy to enforce 2-edit limit
DROP POLICY IF EXISTS "Authors can update own stories" ON public.stories;
CREATE POLICY "Authors can update own stories" ON public.stories
FOR UPDATE TO authenticated
USING (author_id = auth.uid() AND edit_count < 2)
WITH CHECK (author_id = auth.uid());

-- 4. Add country to profiles (already exists in schema but let's ensure)
-- country column already exists, no change needed

-- 5. Community groups system
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

-- Community members
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

-- Community payments
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

-- Community stories (posts within a community)
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

-- Content flags (silent tracking for admin only)
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

-- Only super admin can see flags
CREATE POLICY "Only super admin can view flags" ON public.content_flags
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert flags" ON public.content_flags
FOR INSERT TO authenticated WITH CHECK (true);
