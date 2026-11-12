import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { loadPortalAccess, type PortalAccess } from "@/src/lib/portal-access";
import { createPortalAccessSource } from "@/src/lib/portal-access-source";

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "finance_officer" | "risk_auditor" | "admin";
  status: "active" | "suspended";
}

export type AdminPortalAccessResult =
  | { status: "allowed"; admin: AdminUserDetail }
  | { status: "unauthenticated" }
  | { status: "forbidden"; message: string }
  | { status: "unavailable"; reason: string };

/**
 * Xác thực phiên đăng nhập và phân quyền Super Admin cho Back-Office
 */
export const getAdminPortalAccess = cache(async (): Promise<AdminPortalAccessResult> => {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // 1. Kiểm tra session cơ bản
    if (authError || !user) {
      if (process.env.NODE_ENV !== "production") {
        // Trong môi trường development / testing, cung cấp fallback Super Admin để review giao diện
        return {
          status: "allowed",
          admin: {
            id: "00000000-0000-4000-a000-000000000001",
            email: "superadmin@travellink.ai",
            name: "Super Admin (Local Dev)",
            role: "super_admin",
            status: "active",
          },
        };
      }
      return { status: "unauthenticated" };
    }

    // 2. Tra cứu quyền trong bảng public.admins
    const { data: adminRecord, error: adminQueryError } = await (supabase as any)
      .from("admins")
      .select("id, email, name, role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (adminQueryError) {
      console.warn("[AdminPortal] Lỗi truy vấn bảng admins:", adminQueryError.message);
      if (process.env.NODE_ENV !== "production") {
        return {
          status: "allowed",
          admin: {
            id: user.id,
            email: user.email || "dev-admin@travellink.ai",
            name: "Super Admin (Dev Fallback)",
            role: "super_admin",
            status: "active",
          },
        };
      }
      return { status: "unavailable", reason: "Lỗi kiểm tra quyền hạn Super Admin." };
    }

    if (!adminRecord) {
      if (process.env.NODE_ENV !== "production") {
        return {
          status: "allowed",
          admin: {
            id: user.id,
            email: user.email || "dev-admin@travellink.ai",
            name: "Super Admin (Dev Fallback)",
            role: "super_admin",
            status: "active",
          },
        };
      }
      return {
        status: "forbidden",
        message: "Tài khoản của bạn không có đặc quyền truy cập Phân hệ Quản trị Vận hành (Back-Office).",
      };
    }

    if (adminRecord.status === "suspended") {
      return {
        status: "forbidden",
        message: "Tài khoản Quản trị viên của bạn đang bị tạm khóa.",
      };
    }

    return {
      status: "allowed",
      admin: {
        id: adminRecord.id,
        email: adminRecord.email,
        name: adminRecord.name || "Quản trị viên",
        role: adminRecord.role || "super_admin",
        status: adminRecord.status || "active",
      },
    };
  } catch (err: any) {
    console.error("[AdminPortal] Lỗi ngoại lệ trong getAdminPortalAccess:", err);
    if (process.env.NODE_ENV !== "production") {
      return {
        status: "allowed",
        admin: {
          id: "00000000-0000-4000-a000-000000000001",
          email: "superadmin@travellink.ai",
          name: "Super Admin (Dev Exception Fallback)",
          role: "super_admin",
          status: "active",
        },
      };
    }
    return { status: "unavailable", reason: err?.message || "Lỗi hệ thống xác thực." };
  }
});
