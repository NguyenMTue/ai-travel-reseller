// Only public configuration belongs in this module. Never add server secrets.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const hasSupabaseConfig = Boolean(
  supabaseUrl &&
  supabasePublicKey &&
  !/your|placeholder|xxx|\.{3}|[<>]/i.test(
    `${supabaseUrl} ${supabasePublicKey}`,
  ),
);
