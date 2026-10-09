"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { cookies } from "next/headers";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import {
  loginSchema,
  signupSchema,
  safeNextPath,
} from "@/src/lib/auth-validation";

export async function login(formData: FormData) {
  if (!hasSupabaseConfig)
    return { error: "Chưa cấu hình dịch vụ xác thực. Vui lòng thử lại sau." };
  const supabase = createClient(await cookies());

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = safeNextPath(formData.get("next"));
  if (!loginSchema.safeParse({ email, password }).success)
    return { error: "Vui lòng nhập email và mật khẩu hợp lệ." };

  const { error } = await supabase.auth
    .signInWithPassword({ email, password })
    .catch(() => ({ error: { message: "network" } }));

  if (error) {
    return {
      error:
        "Không thể đăng nhập. Kiểm tra email, mật khẩu hoặc kết nối và thử lại.",
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  if (!hasSupabaseConfig)
    return { error: "Chưa cấu hình dịch vụ xác thực. Vui lòng thử lại sau." };
  const supabase = createClient(await cookies());

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "reseller"; // 'merchant' hoặc 'reseller'
  const fullName = (formData.get("full_name") as string) || "Người dùng mới";

  if (
    !signupSchema.safeParse({ email, password, role, full_name: fullName })
      .success
  )
    return {
      error: "Kiểm tra họ tên, email, vai trò và mật khẩu tối thiểu 8 ký tự.",
    };

  const { error } = await supabase.auth
    .signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        },
      },
    })
    .catch(() => ({ error: { message: "network" } }));

  if (error) {
    return {
      error:
        "Chưa thể tạo tài khoản. Vui lòng kiểm tra thông tin hoặc thử lại sau.",
    };
  }

  revalidatePath("/", "layout");
  // Khi đăng ký thành công (nếu cần xác nhận email thì hướng dẫn user kiểm tra email)
  redirect("/login?message=check_email");
}

export async function logout() {
  if (!hasSupabaseConfig)
    return { error: "Chưa cấu hình dịch vụ xác thực. Vui lòng thử lại sau." };
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
