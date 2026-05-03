
-- 1. Profiles: stop exposing emails to all authenticated users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 2. community_members: prevent self role escalation; protect onboarding_answers
DROP POLICY IF EXISTS "Users can update own membership" ON public.community_members;
CREATE POLICY "Users can update own membership"
  ON public.community_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND role = (SELECT cm.role FROM public.community_members cm WHERE cm.id = community_members.id)
  );

DROP POLICY IF EXISTS "Anyone can view members" ON public.community_members;
-- Restrict full row reads to: self, fellow community members, community owner, admins
CREATE POLICY "Members and admins can view community members"
  ON public.community_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_members me
      WHERE me.community_id = community_members.community_id
        AND me.user_id = auth.uid()
        AND me.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.community_groups g
      WHERE g.id = community_members.community_id AND g.created_by = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- Public-safe view (no onboarding_answers, no engagement score)
CREATE OR REPLACE VIEW public.public_community_members AS
SELECT id, community_id, user_id, role, status, joined_at
FROM public.community_members
WHERE status = 'active';
GRANT SELECT ON public.public_community_members TO anon, authenticated;

-- 3. family_verifications: hide evidence_text from the public; only owner/admin see full row
DROP POLICY IF EXISTS "Anyone can view verified family" ON public.family_verifications;
CREATE POLICY "Owner and admins can view verifications"
  ON public.family_verifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE OR REPLACE VIEW public.public_family_verifications AS
SELECT id, memorial_id, user_id, relationship, status, created_at
FROM public.family_verifications
WHERE status = 'verified';
GRANT SELECT ON public.public_family_verifications TO anon, authenticated;

-- 4. contributions: hide donor/payment details from public
DROP POLICY IF EXISTS "Anyone can view contributions" ON public.contributions;
CREATE POLICY "Owners and admins can view full contributions"
  ON public.contributions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.fundraisers f
      WHERE f.id = contributions.fundraiser_id AND f.created_by = auth.uid()
    )
  );

-- Public-safe view: anonymized supporter feed
CREATE OR REPLACE VIEW public.public_contributions AS
SELECT
  id,
  fundraiser_id,
  CASE WHEN is_anonymous THEN NULL ELSE donor_name END AS donor_name,
  gross_amount,
  CASE WHEN is_anonymous THEN NULL ELSE note_to_family END AS note_to_family,
  is_anonymous,
  payment_status,
  created_at
FROM public.contributions
WHERE payment_status = 'success';
GRANT SELECT ON public.public_contributions TO anon, authenticated;

-- 5. fundraisers: hide admin_notes and rejection_reason from public
DROP POLICY IF EXISTS "Anyone can view fundraisers" ON public.fundraisers;
CREATE POLICY "Owners and admins can view fundraisers fully"
  ON public.fundraisers FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE OR REPLACE VIEW public.public_fundraisers AS
SELECT
  id, title, description, target_amount, current_amount,
  created_by, status, created_at, slug, short_id,
  relationship_to_deceased, personal_statement, memorial_id,
  highlight_until, highlight_tier, deadline
FROM public.fundraisers
WHERE status IN ('active', 'completed', 'approved');
GRANT SELECT ON public.public_fundraisers TO anon, authenticated;

-- 6. Storage: restrict UPDATE on the public buckets to original uploader/admin
DROP POLICY IF EXISTS "Users can update own memorial photos" ON storage.objects;
CREATE POLICY "Users can update own memorial photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'memorial-photos' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'memorial-photos' AND owner = auth.uid());

DROP POLICY IF EXISTS "Users can update own fundraiser images" ON storage.objects;
CREATE POLICY "Users can update own fundraiser images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'fundraiser-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'fundraiser-images' AND owner = auth.uid());

-- 7. Lock down public execution of helper that mutates fundraiser amounts.
-- It is only meant to be called server-side via service role / edge functions.
REVOKE EXECUTE ON FUNCTION public.increment_fundraiser_amount(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_fundraiser_amount(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_fundraiser_amount(uuid, integer) FROM authenticated;
