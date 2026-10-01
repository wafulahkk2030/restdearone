GRANT SELECT ON public.fundraisers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fundraisers TO authenticated;
GRANT ALL ON public.fundraisers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contributions TO authenticated;
GRANT ALL ON public.contributions TO service_role;