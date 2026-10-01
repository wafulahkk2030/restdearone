CREATE OR REPLACE FUNCTION public.is_chat_member(_chat_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id=_chat_id AND user_id=_user_id)
$$;
CREATE OR REPLACE FUNCTION public.is_active_community_member(_community_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.community_members WHERE community_id=_community_id AND user_id=_user_id AND status='active')
$$;
CREATE OR REPLACE FUNCTION public.community_member_role(_member_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.community_members WHERE id=_member_id
$$;
REVOKE EXECUTE ON FUNCTION public.is_chat_member(uuid,uuid), public.is_active_community_member(uuid,uuid), public.community_member_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_chat_member(uuid,uuid), public.is_active_community_member(uuid,uuid), public.community_member_role(uuid) TO authenticated;

DROP POLICY "Members can view chat members" ON public.chat_members;
CREATE POLICY "Members can view chat members" ON public.chat_members FOR SELECT TO authenticated
USING (public.is_chat_member(chat_id, auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY "Members and admins can view community members" ON public.community_members;
CREATE POLICY "Members and admins can view community members" ON public.community_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_active_community_member(community_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.community_groups g WHERE g.id=community_members.community_id AND g.created_by=auth.uid())
  OR public.is_admin(auth.uid()));

DROP POLICY "Users can update own membership" ON public.community_members;
CREATE POLICY "Users can update own membership" ON public.community_members FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND role = public.community_member_role(id));

CREATE POLICY "Admins can manage community members" ON public.community_members FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage community stories" ON public.community_stories FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage communities" ON public.community_groups FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats, public.chat_members, public.chat_messages, public.community_members, public.community_stories, public.community_groups TO authenticated;
GRANT ALL ON public.chats, public.chat_members, public.chat_messages, public.community_members, public.community_stories, public.community_groups TO service_role;