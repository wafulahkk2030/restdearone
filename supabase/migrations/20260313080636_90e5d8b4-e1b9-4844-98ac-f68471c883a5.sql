
-- Fix security definer view - use SECURITY INVOKER instead
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS SELECT id, username, display_name, avatar_url, bio, country, city, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Fix overly permissive INSERT on content_flags
DROP POLICY IF EXISTS "System can insert flags" ON public.content_flags;
CREATE POLICY "Admins can insert flags" ON public.content_flags
FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- Also allow the edge function (service role) to insert flags - done via service role key, no policy needed
