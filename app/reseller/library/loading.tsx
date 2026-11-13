import { Film, Loader2 } from "lucide-react";

export default function ResellerLibraryLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 animate-pulse">
        <Film size={24} />
      </div>
      <h2 className="text-xl font-medium [font-family:var(--font-display)]">
        Đang tải Thư viện Media & Video AI…
      </h2>
      <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 size={16} className="animate-spin text-primary" />
        Đang đồng bộ dữ liệu chiến dịch và nội dung video từ hệ thống
      </p>
    </div>
  );
}
