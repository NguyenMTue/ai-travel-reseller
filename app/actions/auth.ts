"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { cookies } from "next/headers";

export async function login(formData: FormData) {
  const supabase = createClient(await cookies());

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/merchant";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const supabase = createClient(await cookies());

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "reseller"; // 'merchant' hoặc 'reseller'
  const fullName = (formData.get("full_name") as string) || "Người dùng mới";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  // Khi đăng ký thành công (nếu cần xác nhận email thì hướng dẫn user kiểm tra email)
  redirect("/login?message=check_email");
}

export async function logout() {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
