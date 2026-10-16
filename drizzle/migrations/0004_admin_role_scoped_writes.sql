CREATE OR REPLACE FUNCTION public.admin_can_write_area(_user_id uuid, _area text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND (
    role IN ('super_admin','platform_admin')
    OR (role='community_moderator' AND _area IN ('community','moderation'))
    OR (role='memorial_moderator' AND _area IN ('memorial','moderation'))
    OR (role='support_admin' AND _area='support')))
$$;
REVOKE EXECUTE ON FUNCTION public.admin_can_write_area(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_can_write_area(uuid,text) TO authenticated, service_role;
DO $$
DECLARE r record; c text;
BEGIN
FOR r IN SELECT * FROM (VALUES
 ('chats','community','created_by'),('chat_members','community','user_id'),('chat_messages','community','sender_id'),
 ('community_groups','community','created_by'),('community_members','community','user_id'),('community_payments','community','user_id'),
 ('community_stories','community','author_id'),('forum_posts','community','author_id'),('forum_comments','community','author_id'),('invites','community','created_by'),
 ('memorial_pages','memorial','created_by'),('stories','memorial','author_id'),('story_comments','memorial','author_id'),('media_embeds','memorial','added_by'),
 ('family_verifications','memorial','user_id'),('memorial_followers','memorial','user_id'),('memory_keywords','memorial',NULL),('memory_prompts','memorial',NULL),
 ('prompt_responses','memorial','author_id'),('story_reactions','memorial','user_id'),('flower_tributes','memorial','sender_user_id'),
 ('reports','moderation','reported_by'),('content_flags','moderation','user_id'),
 ('notifications','support','user_id'),('newsletter_subscribers','support','user_id'),
 ('contributions','platform','user_id'),('fundraisers','platform','created_by'),('fundraiser_payouts','platform',NULL),('fundraiser_images','platform','uploaded_by'),
 ('legend_articles','platform','submitted_by'),('legend_contributions','platform','contributor_user_id'),('national_legends','platform','submitted_by'),
 ('payments','platform','user_id'),('profiles','platform','id'),('user_suspensions','platform',NULL),('user_warnings','platform',NULL),('site_settings','platform',NULL)
) v(t,a,o) LOOP
  c := format('(NOT public.is_admin(auth.uid()) OR public.admin_can_write_area(auth.uid(), %L)%s)', r.a, CASE WHEN r.o IS NULL THEN '' ELSE format(' OR %I = auth.uid()', r.o) END);
  EXECUTE format('DROP POLICY IF EXISTS "Role scope update" ON public.%I', r.t);
  EXECUTE format('CREATE POLICY "Role scope update" ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING %s WITH CHECK %s', r.t, c, c);
  EXECUTE format('DROP POLICY IF EXISTS "Role scope delete" ON public.%I', r.t);
  EXECUTE format('CREATE POLICY "Role scope delete" ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING %s', r.t, c);
END LOOP;
END $$;