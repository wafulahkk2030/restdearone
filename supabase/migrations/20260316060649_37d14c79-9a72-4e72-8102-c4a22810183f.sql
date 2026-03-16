
-- Admin full access: add missing delete/manage policies

-- Forum posts: admin can delete
CREATE POLICY "Admins can manage forum posts"
ON public.forum_posts FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Forum comments: admin can delete
CREATE POLICY "Admins can manage forum comments"
ON public.forum_comments FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Story comments: admin can manage
CREATE POLICY "Admins can manage story comments"
ON public.story_comments FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Invites: admin can manage
CREATE POLICY "Admins can manage invites"
ON public.invites FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Community payments: admin can update
CREATE POLICY "Admins can manage community payments"
ON public.community_payments FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Payments: admin can manage (update/delete)
CREATE POLICY "Admins can manage payments"
ON public.payments FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Profiles: admin can view all (already exists) and delete
CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Content flags: admin can manage all
CREATE POLICY "Admins can manage content flags"
ON public.content_flags FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Memorial followers: admin can manage
CREATE POLICY "Admins can manage followers"
ON public.memorial_followers FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Memory keywords: admin can manage
CREATE POLICY "Admins can manage keywords"
ON public.memory_keywords FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Notifications: admin can manage all
CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Story reactions: admin can manage
CREATE POLICY "Admins can manage reactions"
ON public.story_reactions FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Prompt responses: admin can manage
CREATE POLICY "Admins can manage prompt responses"
ON public.prompt_responses FOR ALL TO authenticated
USING (is_admin(auth.uid()));
