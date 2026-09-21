CREATE OR REPLACE FUNCTION public.increment_legend_tribute_amount(legend_id_input uuid, amount_input integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.national_legends
  SET current_tribute_amount = COALESCE(current_tribute_amount, 0) + amount_input
  WHERE id = legend_id_input;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_legend_tribute_amount(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_legend_tribute_amount(uuid, integer) TO service_role;
