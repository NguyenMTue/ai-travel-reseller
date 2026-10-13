-- Cho phép client Supabase (authenticated / anon) đọc bảng vai trò;
-- RLS policy "Allow public read access" đã có nhưng thiếu GRANT SELECT.
GRANT SELECT ON TABLE public.merchants TO authenticated, anon;
GRANT SELECT ON TABLE public.resellers TO authenticated, anon;
