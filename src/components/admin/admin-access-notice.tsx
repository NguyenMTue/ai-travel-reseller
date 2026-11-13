import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { AdminPortalAccessResult } from "@/src/lib/admin/admin-access";

export function AdminAccessNotice({
  access,
}: {
  access: Exclude<AdminPortalAccessResult, { status: "allowed" }>;
}) {
  const isUnauthenticated = access.status === "unauthenticated";
  const isForbidden = access.status === "forbidden";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-border rounded-2xl p-6 text-center shadow-lg">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
          {isUnauthenticated
            ? "Yêu cầu đăng nhập Quản trị viên"
            : isForbidden
              ? "Truy cập bị từ chối"
              : "Hệ thống Quản trị tạm thời gián đoạn"}
        </h1>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {isUnauthenticated
            ? "Bạn cần đăng nhập bằng tài khoản có đặc quyền Super Admin để truy cập vào Phân hệ Back-Office."
            : isForbidden
              ? access.message
              : "Không thể xác minh thẩm quyền truy cập lúc này. Vui lòng kiểm tra lại kết nối mạng."}
        </p>

        <div className="flex flex-col gap-2">
          {isUnauthenticated ? (
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-medium">
              <Link href="/login?next=/admin">
                <LogIn className="w-4 h-4 mr-2" /> Đăng nhập Quản trị viên
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full border-border hover:bg-muted text-foreground">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" /> Quay về Trang chủ
              </Link>
            </Button>
          )}

          <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
            <Link href="/preview/admin">
              Xem thử nghiệm giao diện (Preview Demo Mode)
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
