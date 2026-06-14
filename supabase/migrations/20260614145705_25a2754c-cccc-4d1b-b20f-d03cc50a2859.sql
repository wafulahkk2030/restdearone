REVOKE SELECT (sender_email) ON public.flower_tributes FROM anon;
REVOKE SELECT (contributor_email) ON public.legend_contributions FROM anon;
REVOKE SELECT (donor_email) ON public.contributions FROM anon, authenticated;

DROP POLICY IF EXISTS "Auth users can upload fundraiser images storage" ON storage.objects;
CREATE POLICY "Auth users can upload fundraiser images storage"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fundraiser-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_fundraiser_amount(uuid, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_fundraiser_amount(uuid, integer) TO service_role;