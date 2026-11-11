import { WifiOff } from "lucide-react";

export interface OfflineBannerProps {
  isOffline?: boolean;
}

export function OfflineBanner({ isOffline = false }: OfflineBannerProps) {
  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex min-h-11 w-full items-center justify-center gap-2 border border-[#fde68a] bg-[#fef3c7] px-4 py-2 text-center text-xs font-medium text-[#92400e] sm:text-sm"
    >
      <WifiOff size={18} aria-hidden="true" className="shrink-0" />
      <span>
        Bạn đang ở chế độ ngoại tuyến. Vui lòng kiểm tra lại kết nối Internet.
      </span>
    </div>
  );
}
