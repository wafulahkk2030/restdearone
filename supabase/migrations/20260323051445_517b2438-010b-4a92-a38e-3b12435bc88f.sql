-- Allow authors to delete their own forum posts
CREATE POLICY "Authors can delete own forum posts"
  ON forum_posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Allow admins to insert notifications for any user (for admin send notification feature)
-- The existing policy already covers this via is_admin check