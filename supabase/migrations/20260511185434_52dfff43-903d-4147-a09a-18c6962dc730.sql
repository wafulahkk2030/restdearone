
-- Drop sensitive payout columns from fundraisers (payout details live in fundraiser_payouts which has owner-scoped RLS)
ALTER TABLE public.fundraisers DROP COLUMN IF EXISTS payout_method;
ALTER TABLE public.fundraisers DROP COLUMN IF EXISTS payout_details;
ALTER TABLE public.fundraisers DROP COLUMN IF EXISTS payout_account;

-- Require active community membership to post community stories
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

-- Require completed community payment (or creator/admin) to join a community
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

-- Remove sensitive tables from realtime broadcast (donor/payout details should not be broadcast)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contributions') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.contributions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fundraisers') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.fundraisers';
  END IF;
END $$;
