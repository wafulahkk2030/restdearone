
-- Fix overly permissive INSERT policy on notifications
DROP POLICY "System can insert notifications" ON public.notifications;

-- Allow authenticated users and service role to insert notifications
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
