-- Fix: notifications INSERT policy allows any authenticated user to insert for ANY user_id
-- Replace with scoped policy: users can only insert notifications for themselves OR admins can insert for anyone
DROP POLICY "Authenticated can insert notifications" ON notifications;

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));