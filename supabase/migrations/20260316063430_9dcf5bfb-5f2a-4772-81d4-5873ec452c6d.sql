
-- Flower tributes table
CREATE TABLE public.flower_tributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES public.memorial_pages(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  sender_name text NOT NULL,
  flower_type text NOT NULL,
  tribute_value integer NOT NULL,
  tribute_note text,
  payment_reference text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flower_tributes ENABLE ROW LEVEL SECURITY;

-- Anyone can view tributes
CREATE POLICY "Anyone can view tributes" ON public.flower_tributes FOR SELECT TO public USING (true);

-- Auth users can create tributes
CREATE POLICY "Auth users can create tributes" ON public.flower_tributes FOR INSERT TO authenticated WITH CHECK (sender_user_id = auth.uid());

-- Admins can manage tributes
CREATE POLICY "Admins can manage tributes" ON public.flower_tributes FOR ALL TO authenticated USING (is_admin(auth.uid()));
