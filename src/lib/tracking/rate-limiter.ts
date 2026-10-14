export type RateLimitResult = {
  isValid: boolean;
  invalidReason: string | null;
  currentCount: number;
};

type RateLimitOptions = {
  windowMs?: number; // Cửa sổ thời gian (mặc định 60,000ms = 1 phút)
  maxRequests?: number; // Số lượt click tối đa trong cửa sổ (mặc định 10)
};

// Lưu trữ in-memory timestamps theo key: `${ipAddress}:${linkId}`
const clickLogMap = new Map<string, number[]>();

// Thời gian dọn dẹp cache cũ định kỳ (10 phút)
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }
  lastCleanup = now;
  const cutoff = now - windowMs;

  for (const [key, timestamps] of clickLogMap.entries()) {
    const validTimestamps = timestamps.filter((t) => t > cutoff);
    if (validTimestamps.length === 0) {
      clickLogMap.delete(key);
    } else {
      clickLogMap.set(key, validTimestamps);
    }
  }
}

/**
 * Kiểm tra Rate Limiting chống spam click / click tặc theo IP và link tiếp thị.
 * Quy tắc: Cùng 1 IP click liên tục quá `maxRequests` lần trong 1 phút thì đánh dấu không hợp lệ.
 */
export function checkClickRateLimit(
  ipAddress: string | null | undefined,
  linkId: string,
  options: RateLimitOptions = {},
): RateLimitResult {
  const windowMs = options.windowMs ?? 60 * 1000; // 1 phút
  const maxRequests = options.maxRequests ?? 10; // 10 clicks

  // Nếu không có IP, bỏ qua rate limiting để không chặn nhầm khách vãng lai hợp lệ
  if (!ipAddress) {
    return {
      isValid: true,
      invalidReason: null,
      currentCount: 1,
    };
  }

  const cleanIp = ipAddress.trim();
  const key = `${cleanIp}:${linkId}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  cleanupStaleEntries(windowMs);

  const existingTimestamps = clickLogMap.get(key) || [];
  // Lọc chỉ giữ lại các lượt click nằm trong cửa sổ thời gian gần nhất
  const recentTimestamps = existingTimestamps.filter((t) => t > windowStart);

  if (recentTimestamps.length >= maxRequests) {
    // Vượt quá ngưỡng cho phép trong 1 phút
    return {
      isValid: false,
      invalidReason: "rate_limit_exceeded",
      currentCount: recentTimestamps.length + 1,
    };
  }

  // Ghi nhận lượt click mới vào bộ nhớ
  recentTimestamps.push(now);
  clickLogMap.set(key, recentTimestamps);

  return {
    isValid: true,
    invalidReason: null,
    currentCount: recentTimestamps.length,
  };
}

/**
 * Xóa cache rate limiter (dùng cho integration test / test suite)
 */
export function clearRateLimitCache(): void {
  clickLogMap.clear();
}
