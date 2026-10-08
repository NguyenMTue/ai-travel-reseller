import { AuthForm } from "@/src/components/auth/auth-form";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
export const metadata = { title: "Đăng ký" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) { const params = await searchParams; return <AuthForm mode="register" configured={hasSupabaseConfig} next="/merchant" initialRole={params.role} />; }
