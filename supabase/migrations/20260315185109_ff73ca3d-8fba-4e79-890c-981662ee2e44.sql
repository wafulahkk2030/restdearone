
-- Drop existing FKs pointing to auth.users
ALTER TABLE public.stories DROP CONSTRAINT stories_author_id_fkey;
ALTER TABLE public.story_comments DROP CONSTRAINT story_comments_author_id_fkey;
ALTER TABLE public.prompt_responses DROP CONSTRAINT prompt_responses_author_id_fkey;
ALTER TABLE public.forum_posts DROP CONSTRAINT forum_posts_author_id_fkey;
ALTER TABLE public.forum_comments DROP CONSTRAINT forum_comments_author_id_fkey;
ALTER TABLE public.community_stories DROP CONSTRAINT community_stories_author_id_fkey;

-- Recreate FKs pointing to profiles.id
ALTER TABLE public.stories ADD CONSTRAINT stories_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.story_comments ADD CONSTRAINT story_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.prompt_responses ADD CONSTRAINT prompt_responses_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.forum_comments ADD CONSTRAINT forum_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.community_stories ADD CONSTRAINT community_stories_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
