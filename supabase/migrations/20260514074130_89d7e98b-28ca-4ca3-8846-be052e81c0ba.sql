ALTER TABLE public.flower_tributes ALTER COLUMN sender_user_id DROP NOT NULL;
ALTER TABLE public.flower_tributes ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE public.contributions ADD COLUMN IF NOT EXISTS donor_email TEXT;