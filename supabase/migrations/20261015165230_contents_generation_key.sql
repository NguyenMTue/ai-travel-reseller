ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS generation_key text;

CREATE UNIQUE INDEX IF NOT EXISTS contents_generation_key_uidx
  ON public.contents (generation_key);