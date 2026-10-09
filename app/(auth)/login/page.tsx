import { AuthForm } from "@/src/components/auth/auth-form";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
export const metadata = { title: "Đăng nhập" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; message?: string }> }) { const params = await searchParams; return <AuthForm mode="login" configured={hasSupabaseConfig} next={params.next || "/merchant"} checkEmail={params.message === "check_email"} />; }
