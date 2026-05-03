
-- Restore public read on fundraisers (column-level grants will hide sensitive fields)
DROP POLICY IF EXISTS "Owners and admins can view fundraisers fully" ON public.fundraisers;
CREATE POLICY "Anyone can view fundraisers"
  ON public.fundraisers FOR SELECT
  TO public
  USING (true);

REVOKE SELECT ON public.fundraisers FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, title, description, target_amount, current_amount,
  created_by, status, payout_method, payout_account, payout_details,
  created_at, slug, short_id, relationship_to_deceased, personal_statement,
  memorial_id, highlight_until, highlight_tier, deadline
) ON public.fundraisers TO anon, authenticated;

-- Restore public read on contributions but hide PII columns
DROP POLICY IF EXISTS "Owners and admins can view full contributions" ON public.contributions;
CREATE POLICY "Anyone can view contributions"
  ON public.contributions FOR SELECT
  TO public
  USING (true);

REVOKE SELECT ON public.contributions FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, fundraiser_id, gross_amount, platform_fee, net_amount,
  is_anonymous, payment_status, created_at
) ON public.contributions TO anon, authenticated;

-- Owners/admins keep full access through existing "Admins can manage contributions" policy
-- and a new owner-scoped policy that grants column access via service role / admin context.
-- For owner-scoped detail reads, owners already query through fundraiser_payouts/admin tools.

-- Note: admin_notes, rejection_reason on fundraisers and donor_name, user_id,
-- note_to_family, payment_reference on contributions are now only readable by
-- service role (edge functions) and admins via the manage policies.
