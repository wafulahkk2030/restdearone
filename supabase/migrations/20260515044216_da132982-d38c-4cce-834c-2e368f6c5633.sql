
-- 1. flower_tributes.sender_email — hide from public/authenticated
REVOKE SELECT (sender_email) ON public.flower_tributes FROM anon, authenticated;

-- 2. legend_contributions.contributor_email — hide from public/authenticated
REVOKE SELECT (contributor_email) ON public.legend_contributions FROM anon, authenticated;

-- 3. contributions — hide donor PII and financial breakdown from authenticated users
REVOKE SELECT (donor_email, payment_reference, gross_amount, net_amount, platform_fee)
  ON public.contributions FROM anon, authenticated;

-- 4. memorial_followers.user_id — hide from anon (counts still work; signed-in users still see who they follow)
REVOKE SELECT (user_id) ON public.memorial_followers FROM anon;

-- 5. story_reactions.user_id — hide from anon
REVOKE SELECT (user_id) ON public.story_reactions FROM anon;

-- 6. community_members.onboarding_answers — hide from members
REVOKE SELECT (onboarding_answers) ON public.community_members FROM anon, authenticated;
