CREATE TABLE public.chat_quota (
  wallet text PRIMARY KEY,
  used integer NOT NULL DEFAULT 0,
  quota integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_quota TO anon, authenticated;
GRANT ALL ON public.chat_quota TO service_role;
ALTER TABLE public.chat_quota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public chat_quota" ON public.chat_quota FOR ALL USING (true) WITH CHECK (true);