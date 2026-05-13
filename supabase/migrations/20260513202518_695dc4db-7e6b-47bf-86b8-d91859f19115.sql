
-- 1. Lock down contributions: remove public read; allow donor, fundraiser owner, admin only
DROP POLICY IF EXISTS "Anyone can view contributions" ON public.contributions;

CREATE POLICY "Donor owner or admin can view contributions"
ON public.contributions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.fundraisers f WHERE f.id = contributions.fundraiser_id AND f.created_by = auth.uid())
);

-- 2. Hide internal admin columns on fundraisers from non-admins/non-owners
DROP POLICY IF EXISTS "Anyone can view fundraisers" ON public.fundraisers;

CREATE POLICY "Public can view fundraisers"
ON public.fundraisers FOR SELECT
TO anon, authenticated
USING (true);

REVOKE SELECT (admin_notes, rejection_reason) ON public.fundraisers FROM anon, authenticated;
GRANT SELECT (admin_notes, rejection_reason) ON public.fundraisers TO service_role;

-- 3. Restrict invites SELECT to creator/admin (lookups by code go through edge function with service role)
DROP POLICY IF EXISTS "Anyone can view invites" ON public.invites;

CREATE POLICY "Creator or admin can view invites"
ON public.invites FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR is_admin(auth.uid()));

-- 4. Fundraiser images: require fundraiser ownership for INSERT
DROP POLICY IF EXISTS "Auth users can upload fundraiser images" ON public.fundraiser_images;

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

-- 5. Realtime: drop overly broad fundraiser:%/memorial:% topic patterns
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
