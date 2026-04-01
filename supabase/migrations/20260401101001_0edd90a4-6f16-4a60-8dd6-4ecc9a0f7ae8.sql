
-- Fix search path on increment function
CREATE OR REPLACE FUNCTION public.increment_fundraiser_amount(
  fundraiser_id_input uuid,
  amount_input integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.fundraisers
  SET current_amount = current_amount + amount_input
  WHERE id = fundraiser_id_input;
END;
$$;

-- Fix permissive RLS: drop and recreate contributions INSERT policy
DROP POLICY IF EXISTS "Auth users can create contributions" ON public.contributions;
CREATE POLICY "Auth users can create contributions" ON public.contributions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
