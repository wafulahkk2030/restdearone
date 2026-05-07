
-- 1. Recreate views with security_invoker to fix SECURITY DEFINER view warnings
ALTER VIEW IF EXISTS public.public_profiles SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_community_members SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_family_verifications SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_contributions SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_fundraisers SET (security_invoker = true);

-- 2. Community stories: enforce membership
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

-- 3. Fundraisers: revoke sensitive payout/personal columns from public roles
REVOKE SELECT (payout_method, payout_details, payout_account, personal_statement, relationship_to_deceased)
  ON public.fundraisers FROM anon, authenticated;

-- 4. Flower tributes: revoke payment_reference from public roles
REVOKE SELECT (payment_reference) ON public.flower_tributes FROM anon, authenticated;

-- 5. Security events: tighten INSERT
DROP POLICY IF EXISTS "Authenticated can insert security events" ON public.security_events;
CREATE POLICY "Users can insert own security events"
ON public.security_events
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 6. Realtime messages: scope subscriptions to participants
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can subscribe to own chats" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe to own chats"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow chat-specific topics only if user is a member of that chat
  (
    realtime.topic() LIKE 'chat:%'
    AND EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.chat_id::text = split_part(realtime.topic(), ':', 2)
        AND cm.user_id = auth.uid()
    )
  )
  -- Allow user-specific topics only for that user
  OR (
    realtime.topic() LIKE 'user:%'
    AND split_part(realtime.topic(), ':', 2) = auth.uid()::text
  )
  -- Allow public broadcast topics for fundraisers/contributions/memorials (read-only public data)
  OR realtime.topic() LIKE 'public:%'
  OR realtime.topic() LIKE 'fundraiser:%'
  OR realtime.topic() LIKE 'memorial:%'
);
