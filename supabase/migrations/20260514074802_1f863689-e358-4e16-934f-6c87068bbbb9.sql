-- 1. Hide sender_email from public reads on flower_tributes (keep public visibility for the rest)
REVOKE SELECT (sender_email) ON public.flower_tributes FROM anon, authenticated;
GRANT SELECT (sender_email) ON public.flower_tributes TO service_role;

-- 2. Tighten contributions SELECT — anonymous donors must stay anonymous to fundraiser owners,
--    and donor_email/user_id are never readable via the table (admins use service_role).
DROP POLICY IF EXISTS "Donor owner or admin can view contributions" ON public.contributions;

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

REVOKE SELECT (donor_email, user_id) ON public.contributions FROM anon, authenticated;
GRANT SELECT (donor_email, user_id) ON public.contributions TO service_role;

-- 3. Restrict chat_members INSERT so users can only join chats they have a legitimate relationship with
DROP POLICY IF EXISTS "Auth users can join chats" ON public.chat_members;

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