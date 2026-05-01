-- 1) Create a private fundraiser_payouts table (owner + admin only)
CREATE TABLE IF NOT EXISTS public.fundraiser_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL UNIQUE,
  payout_method TEXT,
  payout_account TEXT,
  payout_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fundraiser_payouts ENABLE ROW LEVEL SECURITY;

-- Owners can read their own payout info
CREATE POLICY "Owners can view own payout"
ON public.fundraiser_payouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fundraisers f
    WHERE f.id = fundraiser_payouts.fundraiser_id
      AND f.created_by = auth.uid()
  )
);

-- Owners can insert their own payout info
CREATE POLICY "Owners can insert own payout"
ON public.fundraiser_payouts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fundraisers f
    WHERE f.id = fundraiser_payouts.fundraiser_id
      AND f.created_by = auth.uid()
  )
);

-- Owners can update their own payout info
CREATE POLICY "Owners can update own payout"
ON public.fundraiser_payouts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fundraisers f
    WHERE f.id = fundraiser_payouts.fundraiser_id
      AND f.created_by = auth.uid()
  )
);

-- Admins full access
CREATE POLICY "Admins manage all payouts"
ON public.fundraiser_payouts
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 2) Migrate existing data from fundraisers into the private table
INSERT INTO public.fundraiser_payouts (fundraiser_id, payout_method, payout_account, payout_details)
SELECT id, payout_method, payout_account, payout_details
FROM public.fundraisers
WHERE payout_method IS NOT NULL OR payout_account IS NOT NULL OR payout_details IS NOT NULL
ON CONFLICT (fundraiser_id) DO NOTHING;

-- 3) Null out the now-private columns on fundraisers (keep columns to avoid breaking types,
--    but they'll be empty so public reads expose nothing)
UPDATE public.fundraisers
SET payout_method = NULL, payout_account = NULL, payout_details = NULL;

-- 4) Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_fundraiser_payouts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fundraiser_payouts_updated_at ON public.fundraiser_payouts;
CREATE TRIGGER trg_fundraiser_payouts_updated_at
BEFORE UPDATE ON public.fundraiser_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_fundraiser_payouts_updated_at();