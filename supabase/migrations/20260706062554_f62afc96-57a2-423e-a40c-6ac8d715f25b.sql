-- Durable edits and replies for stories/forum comments
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.story_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID NULL REFERENCES public.story_comments(id) ON DELETE CASCADE;
ALTER TABLE public.story_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.forum_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID NULL REFERENCES public.forum_comments(id) ON DELETE CASCADE;
ALTER TABLE public.forum_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'memorial';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ NULL;

-- Keep updated_at accurate for edited content
DROP TRIGGER IF EXISTS update_stories_updated_at ON public.stories;
CREATE TRIGGER update_stories_updated_at
BEFORE UPDATE ON public.stories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON public.forum_posts;
CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_story_comments_updated_at ON public.story_comments;
CREATE TRIGGER update_story_comments_updated_at
BEFORE UPDATE ON public.story_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_comments_updated_at ON public.forum_comments;
CREATE TRIGGER update_forum_comments_updated_at
BEFORE UPDATE ON public.forum_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_legend_articles_updated_at ON public.legend_articles;
CREATE TRIGGER update_legend_articles_updated_at
BEFORE UPDATE ON public.legend_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Explicit Data API grants for all affected tables
GRANT SELECT ON public.stories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;

GRANT SELECT ON public.story_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.story_comments TO authenticated;
GRANT ALL ON public.story_comments TO service_role;

GRANT SELECT ON public.forum_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;

GRANT SELECT ON public.forum_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_comments TO authenticated;
GRANT ALL ON public.forum_comments TO service_role;

GRANT SELECT, INSERT ON public.legend_articles TO anon, authenticated;
GRANT UPDATE, DELETE ON public.legend_articles TO authenticated;
GRANT ALL ON public.legend_articles TO service_role;

GRANT SELECT, INSERT ON public.legend_contributions TO anon, authenticated;
GRANT UPDATE, DELETE ON public.legend_contributions TO authenticated;
GRANT ALL ON public.legend_contributions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- Safer article submission rules
DROP POLICY IF EXISTS "Anyone can submit an article" ON public.legend_articles;
CREATE POLICY "Anyone can submit an article"
ON public.legend_articles
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending_review'
  AND price_amount = 0
  AND payment_reference IS NULL
  AND approved_by IS NULL
  AND approved_at IS NULL
  AND paid_at IS NULL
  AND (submitted_by IS NULL OR submitted_by = auth.uid())
);

DROP POLICY IF EXISTS "Submitters can update own draft articles" ON public.legend_articles;
CREATE POLICY "Submitters can update own draft articles"
ON public.legend_articles
FOR UPDATE
TO authenticated
USING (submitted_by = auth.uid() AND status IN ('pending_review', 'rejected'))
WITH CHECK (
  submitted_by = auth.uid()
  AND status IN ('pending_review', 'rejected')
  AND price_amount = 0
  AND payment_reference IS NULL
  AND approved_by IS NULL
  AND approved_at IS NULL
  AND paid_at IS NULL
);

DROP POLICY IF EXISTS "Submitters can delete own draft articles" ON public.legend_articles;
CREATE POLICY "Submitters can delete own draft articles"
ON public.legend_articles
FOR DELETE
TO authenticated
USING (submitted_by = auth.uid() AND status IN ('pending_review', 'rejected'));

-- Comment/reply editing and deletion for story comments
DROP POLICY IF EXISTS "Authors can update own comments" ON public.story_comments;
CREATE POLICY "Authors can update own comments"
ON public.story_comments
FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Forum comment editing and deletion
DROP POLICY IF EXISTS "Authors can update own forum comments" ON public.forum_comments;
CREATE POLICY "Authors can update own forum comments"
ON public.forum_comments
FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete own forum comments" ON public.forum_comments;
CREATE POLICY "Authors can delete own forum comments"
ON public.forum_comments
FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- Safer public legend contributions: open comments stay open, paid tributes go through the payment function
DROP POLICY IF EXISTS "Anyone can create legend contribution" ON public.legend_contributions;
CREATE POLICY "Anyone can create legend contribution"
ON public.legend_contributions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (
    contribution_type = 'comment'
    AND status = 'completed'
    AND amount = 0
    AND payment_reference IS NULL
    AND contributor_email IS NULL
    AND (contributor_user_id IS NULL OR contributor_user_id = auth.uid())
  )
  OR
  (
    contribution_type = 'tribute'
    AND status = 'pending'
    AND amount > 0
  )
);

DROP POLICY IF EXISTS "Contributors can update own legend comments" ON public.legend_contributions;
CREATE POLICY "Contributors can update own legend comments"
ON public.legend_contributions
FOR UPDATE
TO authenticated
USING (contributor_user_id = auth.uid() AND contribution_type = 'comment')
WITH CHECK (contributor_user_id = auth.uid() AND contribution_type = 'comment' AND status = 'completed' AND amount = 0);

DROP POLICY IF EXISTS "Contributors can delete own legend comments" ON public.legend_contributions;
CREATE POLICY "Contributors can delete own legend comments"
ON public.legend_contributions
FOR DELETE
TO authenticated
USING (contributor_user_id = auth.uid() AND contribution_type = 'comment');

-- Helpful indexes for persistent comment/reply loading
CREATE INDEX IF NOT EXISTS idx_story_comments_story_parent_created ON public.story_comments(story_id, parent_comment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_parent_created ON public.forum_comments(post_id, parent_comment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_story_credit ON public.payments(user_id, memorial_id, payment_type, status, consumed_at);
