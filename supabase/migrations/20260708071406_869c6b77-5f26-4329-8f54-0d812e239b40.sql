-- Admin can delete any comment across the platform
DROP POLICY IF EXISTS "Admins can delete any story comment" ON public.story_comments;
CREATE POLICY "Admins can delete any story comment"
ON public.story_comments FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete any forum comment" ON public.forum_comments;
CREATE POLICY "Admins can delete any forum comment"
ON public.forum_comments FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));