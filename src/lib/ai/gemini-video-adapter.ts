import dns from "node:dns/promises";
import type http from "node:http";
import https from "node:https";
import { GoogleGenAI } from "@google/genai";
import {
  campaignVideoScriptSchema,
  videoAnalysisSchema,
} from "./schemas/video-schema.ts";
import type {
  VideoAnalysisAdapter,
  VideoAnalysisRequest,
} from "./video-analyzer.ts";
import type {
  VideoGenerationAdapter,
  VideoGenerationRequest,
} from "./video-generator.ts";

export const MAX_VIDEO_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];

export const DEFAULT_DOWNLOAD_TIMEOUT_MS = 15_000;
export const DEFAULT_IDLE_TIMEOUT_MS = 5_000;
export const DEFAULT_UPLOAD_TIMEOUT_MS = 30_000;
export const DEFAULT_FILE_GET_TIMEOUT_MS = 10_000;
export const DEFAULT_FILE_POLL_TIMEOUT_MS = 30_000;
export const DEFAULT_CLEANUP_TIMEOUT_MS = 10_000;
export const DEFAULT_MODEL_TIMEOUT_MS = 30_000;

// ============================================================================
// 1. ERROR TYPES & COMPREHENSIVE SECRET SANITIZATION
// ============================================================================

export class GeminiRateLimitError extends Error {
  constructor(message = "Gemini rate limit or quota exceeded (429)") {
    super(message);
    this.name = "GeminiRateLimitError";
  }
}

export class GeminiAdapterError extends Error {
  constructor(message: string) {
    super(sanitizeErrorMessage(message));
    this.name = "GeminiAdapterError";
  }
}

/**
 * Làm sạch hoàn toàn các chuỗi nhạy cảm:
 * - apiKey=..., api_key=..., key=..., token=..., secret=...
 * - Authorization: Bearer ...
 * - Query strings: ?key=..., &apiKey=...
 * - URLs chứa username/password: http://user:pass@host
 * - Không để lộ secret ra bên ngoài error log
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== "string") return "";

  let sanitized = message;

  // 1. Redact key-value pairs dạng key=value hoặc key: value (bảo toàn tên khóa, che giấu value)
  sanitized = sanitized.replace(
    /\b(api[_-]?key|key|token|secret)\s*([=:]\s*)[^\s&,;'"\)\]\}]+/gi,
    "$1$2[REDACTED]",
  );

  // 2. Redact Authorization Bearer header
  sanitized = sanitized.replace(
    /Bearer\s+[a-zA-Z0-9_\.\-]+/gi,
    "Bearer [REDACTED]",
  );

  // 3. Redact query parameters nhạy cảm trong URL
  sanitized = sanitized.replace(
    /([?&](?:api[_-]?key|key|token|secret)=)[^&\s]+/gi,
    "$1[REDACTED]",
  );

  // 4. Redact username:password trong URL: http(s)://user:pass@host
  sanitized = sanitized.replace(
    /((?:https?|ftp):\/\/)(?:[^:\/\s]+):(?:[^@\/\s]+)@/gi,
    "$1[REDACTED]:[REDACTED]@",
  );

  return sanitized;
}

export function isQuotaOrRateLimitError(err: unknown): boolean {
  if (err instanceof GeminiRateLimitError) return true;
  if (!err || typeof err !== "object") return false;

  const candidate = err as {
    status?: number;
    statusCode?: number;
    message?: string;
  };

  if (candidate.status === 429 || candidate.statusCode === 429) {
    return true;
  }

  const message = (candidate.message || "").toLowerCase();
  return (
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("quota exceeded") ||
    message.includes("rate limit")
  );
}

// ============================================================================
// 2. GENERIC TIMEOUT HELPER
// ============================================================================

/**
 * Bao bọc Promise với timeout deadline an toàn.
 * Khi timeout, hàm kích hoạt abortController.abort() (nếu được truyền) để chủ động hủy
 * request/socket ở phía client (HTTP ClientRequest hoặc Gemini SDK abortSignal).
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string,
  abortController?: AbortController,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      if (abortController) {
        try {
          abortController.abort();
        } catch {
          // ignore abort error
        }
      }
      reject(
        new GeminiAdapterError(
          `${operationName} timed out after ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ============================================================================
// 3. STRICT GEMINI FILE URI VALIDATOR
// ============================================================================

/**
 * Thẩm định nghiêm ngặt định dạng URI file Gemini do Files API trả về.
 * Ngăn chặn custom transport hoặc bên thứ ba inject arbitrary HTTPS URL.
 */
export function validateGeminiFileUri(uri: unknown): string {
  if (typeof uri !== "string" || !uri.trim()) {
    throw new GeminiAdapterError("Gemini fileUri must be a non-empty string");
  }

  const trimmed = uri.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new GeminiAdapterError("Invalid Gemini fileUri format");
  }

  if (parsed.protocol !== "https:") {
    throw new GeminiAdapterError(
      `Insecure HTTP URL or forbidden Gemini fileUri protocol: ${parsed.protocol}. Only HTTPS is allowed.`,
    );
  }

  if (parsed.username || parsed.password) {
    throw new GeminiAdapterError(
      "Gemini fileUri must not contain credentials",
    );
  }

  if (parsed.search || parsed.hash) {
    throw new GeminiAdapterError(
      "Gemini fileUri must not contain query parameters or fragments",
    );
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== "generativelanguage.googleapis.com") {
    throw new GeminiAdapterError(
      "Gemini fileUri host is not a trusted Google Gemini Files API endpoint",
    );
  }

  // Must match /v1/files/<id> or /v1beta/files/<id>
  const geminiPathRegex = /^\/v1(?:beta)?\/files\/[a-zA-Z0-9_\-]+$/;
  if (!geminiPathRegex.test(parsed.pathname)) {
    throw new GeminiAdapterError(
      "Gemini fileUri pathname is not a valid Gemini Files API resource path",
    );
  }

  return trimmed;
}

// ============================================================================
// 4. SSRF URL VALIDATOR, HOST ALLOWLIST & DNS PINNING
// ============================================================================

export function isIpAddress(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(":");
}

/**
 * Phân tích chuỗi IPv4 thành số nguyên không dấu 32-bit (uint32).
 * Trả về null nếu không phải định dạng IPv4 hợp lệ (từ chối leading zeroes để tránh octal bypass).
 */
export function parseIpv4(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let uint32 = 0;
  for (let i = 0; i < 4; i++) {
    const part = parts[i];
    if (!/^\d{1,3}$/.test(part)) return null;
    if (part.length > 1 && part.startsWith("0")) return null;
    const num = parseInt(part, 10);
    if (num < 0 || num > 255) return null;
    uint32 = ((uint32 << 8) | num) >>> 0;
  }
  return uint32;
}

/**
 * Kiểm tra xem địa chỉ IPv4 (dưới dạng uint32) có thuộc các dải địa chỉ cấm đối với remote media fetch:
 * - 0.0.0.0/8 (Unspecified / current network)
 * - 10.0.0.0/8 (Private RFC 1918)
 * - 100.64.0.0/10 (Carrier-Grade NAT RFC 6598: 100.64.0.0 - 100.127.255.255)
 * - 127.0.0.0/8 (Loopback)
 * - 169.254.0.0/16 (Link-local / Cloud metadata RFC 3927)
 * - 172.16.0.0/12 (Private RFC 1918: 172.16.0.0 - 172.31.255.255)
 * - 192.0.0.0/24 (IETF Protocol Assignments RFC 6890)
 * - 192.0.2.0/24 (TEST-NET-1 RFC 5737)
 * - 192.88.99.0/24 (6to4 Relay Anycast RFC 7526)
 * - 192.168.0.0/16 (Private RFC 1918)
 * - 198.18.0.0/15 (Network Benchmark RFC 2544: 198.18.0.0 - 198.19.255.255)
 * - 198.51.100.0/24 (TEST-NET-2 RFC 5737)
 * - 203.0.113.0/24 (TEST-NET-3 RFC 5737)
 * - 224.0.0.0/4 (Multicast RFC 5771: 224.0.0.0 - 239.255.255.255, bao gồm 224.0.0.1)
 * - 240.0.0.0/4 (Reserved / Future Use / Limited Broadcast RFC 1112 / RFC 919, bao gồm 255.255.255.255)
 */
export function isForbiddenIpv4Num(ipNum: number): boolean {
  const o1 = (ipNum >>> 24) & 0xff;
  const o2 = (ipNum >>> 16) & 0xff;
  const o3 = (ipNum >>> 8) & 0xff;

  if (o1 === 0) return true; // 0.0.0.0/8
  if (o1 === 10) return true; // 10.0.0.0/8
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return true; // 100.64.0.0/10
  if (o1 === 127) return true; // 127.0.0.0/8
  if (o1 === 169 && o2 === 254) return true; // 169.254.0.0/16
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return true; // 172.16.0.0/12
  if (o1 === 192 && o2 === 0 && o3 === 0) return true; // 192.0.0.0/24
  if (o1 === 192 && o2 === 0 && o3 === 2) return true; // 192.0.2.0/24
  if (o1 === 192 && o2 === 88 && o3 === 99) return true; // 192.88.99.0/24
  if (o1 === 192 && o2 === 168) return true; // 192.168.0.0/16
  if (o1 === 198 && (o2 === 18 || o2 === 19)) return true; // 198.18.0.0/15
  if (o1 === 198 && o2 === 51 && o3 === 100) return true; // 198.51.100.0/24
  if (o1 === 203 && o2 === 0 && o3 === 113) return true; // 203.0.113.0/24
  if ((ipNum >>> 28) === 14) return true; // 224.0.0.0/4 (Multicast, e.g. 224.0.0.1)
  if ((ipNum >>> 28) === 15) return true; // 240.0.0.0/4 (Reserved / Broadcast, e.g. 255.255.255.255)

  return false;
}

/**
 * Phân tích chuỗi IPv6 thành mảng 8 số 16-bit [w0..w7].
 * Xử lý đầy đủ:
 * - Dạng chuẩn 8 nhóm hex
 * - Rút gọn '::'
 * - IPv4-mapped dạng dotted decimal: ::ffff:192.168.1.1
 * - IPv4-mapped dạng hex: ::ffff:7f00:1 hoặc 0:0:0:0:0:ffff:7f00:1
 */
export function parseIpv6(ip: string): number[] | null {
  const clean = ip.replace(/^\[|\]$/g, "").trim().toLowerCase();
  if (!clean || clean.length < 2) return null;

  const lastColon = clean.lastIndexOf(":");
  if (lastColon === -1) return null;
  const tail = clean.slice(lastColon + 1);

  let hexPart = clean;
  let embeddedIpv4Words: [number, number] | null = null;

  if (tail.includes(".")) {
    const ipv4Num = parseIpv4(tail);
    if (ipv4Num === null) return null;
    embeddedIpv4Words = [(ipv4Num >>> 16) & 0xffff, ipv4Num & 0xffff];
    hexPart = clean.slice(0, lastColon);
  }

  const doubleColonMatches = hexPart.match(/::/g);
  if (doubleColonMatches && doubleColonMatches.length > 1) return null;

  let leftParts: string[] = [];
  let rightParts: string[] = [];

  if (hexPart.includes("::")) {
    const [left, right] = hexPart.split("::");
    leftParts = left ? left.split(":") : [];
    rightParts = right ? right.split(":") : [];
  } else {
    leftParts = hexPart.split(":");
  }

  const parseHex = (s: string) => {
    if (!/^[0-9a-f]{1,4}$/i.test(s)) return null;
    return parseInt(s, 16);
  };

  const leftWords: number[] = [];
  for (const p of leftParts) {
    const val = parseHex(p);
    if (val === null) return null;
    leftWords.push(val);
  }

  const rightWords: number[] = [];
  for (const p of rightParts) {
    const val = parseHex(p);
    if (val === null) return null;
    rightWords.push(val);
  }

  const totalEmbedded = embeddedIpv4Words ? 2 : 0;
  const knownCount = leftWords.length + rightWords.length + totalEmbedded;

  if (!hexPart.includes("::")) {
    if (knownCount !== 8) return null;
    const res = [...leftWords];
    if (embeddedIpv4Words) res.push(...embeddedIpv4Words);
    return res;
  } else {
    if (knownCount > 7) return null;
    const zerosNeeded = 8 - knownCount;
    const zeros = new Array(zerosNeeded).fill(0);
    const res = [...leftWords, ...zeros, ...rightWords];
    if (embeddedIpv4Words) res.push(...embeddedIpv4Words);
    return res;
  }
}

/**
 * Kiểm tra xem địa chỉ IPv6 (8 words 16-bit) có thuộc các dải địa chỉ cấm:
 * - ::/128 (Unspecified)
 * - ::1/128 (Loopback)
 * - ::ffff:0:0/96 (IPv4-mapped IPv6, cả dạng hex và dotted decimal):
 *   Phân tích 32 bit thấp thành IPv4 và kiểm tra theo quy tắc IPv4 cấm.
 * - fe80::/10 (Link-Local unicast RFC 4291: fe80::/10 bao gồm fe80–febf)
 * - fec0::/10 (Site-Local unicast RFC 3879, deprecated)
 * - fc00::/7 (Unique Local Address - ULA RFC 4193: fc00::/7 bao gồm fc00–fdff)
 * - ff00::/8 (Multicast RFC 4291)
 * - 2001:db8::/32 (Documentation RFC 3849)
 * - 100::/64 (Discard-only RFC 6666)
 * - 2001:10::/28 (ORCHIDv2 RFC 7343)
 */
export function isForbiddenIpv6Words(w: number[]): boolean {
  if (w.length !== 8) return true;

  // Unspecified ::/128
  if (w.every((val) => val === 0)) return true;

  // Loopback ::1/128
  if (
    w[0] === 0 &&
    w[1] === 0 &&
    w[2] === 0 &&
    w[3] === 0 &&
    w[4] === 0 &&
    w[5] === 0 &&
    w[6] === 0 &&
    w[7] === 1
  ) {
    return true;
  }

  // IPv4-mapped IPv6 ::ffff:0:0/96 (ví dụ ::ffff:127.0.0.1, ::ffff:7f00:1)
  if (
    w[0] === 0 &&
    w[1] === 0 &&
    w[2] === 0 &&
    w[3] === 0 &&
    w[4] === 0 &&
    w[5] === 0xffff
  ) {
    const embeddedIpv4Num = (((w[6] << 16) >>> 0) | w[7]) >>> 0;
    return isForbiddenIpv4Num(embeddedIpv4Num);
  }

  // IPv4-compatible IPv6 ::/96 (deprecated RFC 4291, ví dụ ::127.0.0.1)
  if (
    w[0] === 0 &&
    w[1] === 0 &&
    w[2] === 0 &&
    w[3] === 0 &&
    w[4] === 0 &&
    w[5] === 0
  ) {
    const embeddedIpv4Num = (((w[6] << 16) >>> 0) | w[7]) >>> 0;
    if (embeddedIpv4Num !== 0 && embeddedIpv4Num !== 1) {
      return isForbiddenIpv4Num(embeddedIpv4Num);
    }
  }

  // Link-local unicast fe80::/10 (fe80 - febf)
  // 1111 1110 10xx xxxx -> mask 0xffc0 === 0xfe80
  if ((w[0] & 0xffc0) === 0xfe80) return true;

  // Site-local unicast fec0::/10 (fec0 - feff, deprecated)
  if ((w[0] & 0xffc0) === 0xfec0) return true;

  // Unique Local Address fc00::/7 (fc00 - fdff)
  // 1111 110x xxxx xxxx -> mask 0xfe00 === 0xfc00
  if ((w[0] & 0xfe00) === 0xfc00) return true;

  // Multicast ff00::/8
  // 1111 1111 xxxx xxxx -> mask 0xff00 === 0xff00
  if ((w[0] & 0xff00) === 0xff00) return true;

  // Documentation 2001:db8::/32
  if (w[0] === 0x2001 && w[1] === 0x0db8) return true;

  // Discard prefix 100::/64
  if (w[0] === 0x0100 && w[1] === 0 && w[2] === 0 && w[3] === 0) return true;

  return false;
}

export function isForbiddenIp(ip: string): boolean {
  const clean = ip.replace(/^\[|\]$/g, "").trim();

  // Thử parse IPv4
  const ipv4Num = parseIpv4(clean);
  if (ipv4Num !== null) {
    return isForbiddenIpv4Num(ipv4Num);
  }

  // Thử parse IPv6
  const ipv6Words = parseIpv6(clean);
  if (ipv6Words !== null) {
    return isForbiddenIpv6Words(ipv6Words);
  }

  // Nếu không parse được dưới dạng IP hợp lệ mà isIpAddress là true -> fail-closed cấm
  return true;
}

export function normalizeAllowedHosts(
  hosts?: string[] | string | null,
): string[] {
  if (!hosts) return [];
  const rawList = Array.isArray(hosts) ? hosts : hosts.split(",");
  const cleaned = rawList
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

export function isHostAllowed(
  hostname: string,
  allowedHosts: string[],
): boolean {
  const cleanHost = hostname.toLowerCase().trim();
  if (!cleanHost || allowedHosts.length === 0) return false;

  return allowedHosts.some((allowed) => {
    const cleanAllowed = allowed.toLowerCase().trim();
    if (cleanAllowed.startsWith("*.")) {
      const rootDomain = cleanAllowed.slice(2);
      // *.example.com matches exact rootDomain or .rootDomain subdomains
      // Strict dot separator prevents matching evil-example.com
      return cleanHost === rootDomain || cleanHost.endsWith("." + rootDomain);
    }
    return cleanHost === cleanAllowed;
  });
}

export function validateSafeVideoUrl(
  urlStr: string,
  options?: {
    allowedHosts?: string[] | string | null;
    allowHttp?: boolean;
  },
): URL {
  const allowed = normalizeAllowedHosts(
    options?.allowedHosts !== undefined
      ? options.allowedHosts
      : process.env.VIDEO_SOURCE_ALLOWED_HOSTS,
  );

  // Allowlist bắt buộc: Fail-closed nếu thiếu hoặc rỗng
  if (allowed.length === 0) {
    throw new GeminiAdapterError(
      "VIDEO_SOURCE_ALLOWED_HOSTS is required and cannot be empty (fail-closed).",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new GeminiAdapterError("Invalid video URL format");
  }

  const allowedProtocols = options?.allowHttp
    ? ["http:", "https:"]
    : ["https:"];
  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new GeminiAdapterError(
      `Forbidden video URL protocol: ${parsed.protocol}. Only ${allowedProtocols.join(", ")} allowed.`,
    );
  }

  if (parsed.username || parsed.password) {
    throw new GeminiAdapterError("Video URL must not contain credentials");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Hostnames cấm cơ bản
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new GeminiAdapterError(
      `SSRF protection: local or internal host '${hostname}' is forbidden.`,
    );
  }

  if (isIpAddress(hostname) && isForbiddenIp(hostname)) {
    throw new GeminiAdapterError(
      `SSRF protection: private or loopback IP '${hostname}' is forbidden.`,
    );
  }

  // Thẩm định allowlist nghiêm ngặt
  if (!isHostAllowed(hostname, allowed)) {
    throw new GeminiAdapterError(
      `SSRF protection: host '${hostname}' is not in allowed hosts list.`,
    );
  }

  return parsed;
}

/**
 * Phân giải DNS và kiểm tra toàn diện danh sách IP trả về.
 * Từ chối nếu có bất kỳ IP cấm nào; trả về một IP public đã kiểm định để pin connection.
 */
export async function resolveAndPinHost(
  hostname: string,
  dnsLookupFn: typeof dns.lookup = dns.lookup,
): Promise<string> {
  if (isIpAddress(hostname)) {
    if (isForbiddenIp(hostname)) {
      throw new GeminiAdapterError(
        `SSRF protection: direct IP '${hostname}' is forbidden.`,
      );
    }
    return hostname;
  }

  let addresses: unknown;
  try {
    addresses = await dnsLookupFn(hostname, { all: true });
  } catch (err) {
    throw new GeminiAdapterError(
      `DNS lookup failed for host '${hostname}': ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const rawList = Array.isArray(addresses)
    ? addresses
    : addresses
      ? [addresses]
      : [];

  if (rawList.length === 0) {
    throw new GeminiAdapterError(
      `DNS lookup returned no addresses for host '${hostname}'`,
    );
  }

  const ipEntries: string[] = [];
  for (const item of rawList) {
    const ip =
      typeof item === "string"
        ? item
        : (item as { address?: string })?.address;
    if (!ip) continue;
    if (isForbiddenIp(ip)) {
      throw new GeminiAdapterError(
        `SSRF protection: host '${hostname}' resolved to forbidden IP '${ip}'.`,
      );
    }
    ipEntries.push(ip);
  }

  if (ipEntries.length === 0) {
    throw new GeminiAdapterError(
      `DNS lookup returned no valid addresses for host '${hostname}'`,
    );
  }

  return ipEntries[0];
}

export const resolveAndVerifyHost = resolveAndPinHost;

// ============================================================================
// 5. SECURE DOWNLOADER WITH DNS PINNING & FULL STREAM TIMEOUT
// ============================================================================

export type DownloadResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: AsyncIterable<Uint8Array>;
  destroy: () => void;
};

export interface SafeDownloaderOptions {
  pinnedIp: string;
  overallTimeoutMs: number;
  idleTimeoutMs: number;
  maxSizeBytes: number;
  signal?: AbortSignal;
}

export interface SafeDownloader {
  download(
    url: URL,
    options: SafeDownloaderOptions,
  ): Promise<DownloadResponse>;
}

export class NodeSafeDownloader implements SafeDownloader {
  async download(
    url: URL,
    options: SafeDownloaderOptions,
  ): Promise<DownloadResponse> {
    return new Promise((resolve, reject) => {
      // 1. Nếu signal đã aborted trước khi request bắt đầu thì fail ngay, không mở socket
      if (options.signal?.aborted) {
        reject(
          new GeminiAdapterError("Download aborted before request started"),
        );
        return;
      }

      const family = options.pinnedIp.includes(":") ? 6 : 4;
      let settled = false;
      let aborted = false;
      let req: http.ClientRequest | undefined;
      let activeRes: http.IncomingMessage | undefined;

      const cleanupAbortListener = () => {
        if (options.signal && onAbort) {
          options.signal.removeEventListener("abort", onAbort);
        }
      };

      const safeReject = (err: Error) => {
        if (!settled) {
          settled = true;
          cleanupAbortListener();
          reject(err);
        }
      };

      const safeResolve = (resp: DownloadResponse) => {
        if (!settled) {
          settled = true;
          cleanupAbortListener();
          resolve(resp);
        }
      };

      const onAbort = () => {
        if (aborted) return;
        aborted = true;
        cleanupAbortListener();
        try {
          if (req) {
            req.destroy(new Error("Request aborted by signal"));
          }
        } catch {
          // idempotent
        }
        try {
          if (activeRes) {
            activeRes.destroy(new Error("Response aborted by signal"));
          }
        } catch {
          // idempotent
        }
        safeReject(new GeminiAdapterError("Download aborted by signal"));
      };

      if (options.signal) {
        options.signal.addEventListener("abort", onAbort, { once: true });
      }

      try {
        req = https.request(
          {
            protocol: "https:",
            hostname: url.hostname,
            port: url.port ? parseInt(url.port, 10) : 443,
            path: url.pathname + url.search,
            method: "GET",
            headers: {
              Host: url.host,
              Accept: "*/*",
            },
            servername: url.hostname, // SNI cho chứng chỉ TLS
            rejectUnauthorized: true, // Bắt buộc thẩm định TLS certificate hợp lệ
            signal: options.signal, // Gắn trực tiếp vào https.request options nếu Node hỗ trợ
            lookup: (_hostname, _opts, cb) => {
              // Pin connection vào đúng IP public đã được kiểm tra, không query DNS lần 2
              cb(null, options.pinnedIp, family);
            },
          },
          (res) => {
            if (settled) {
              try {
                res.destroy();
              } catch {
                // idempotent
              }
              return;
            }
            activeRes = res;

            const headers: Record<string, string> = {};
            for (const [key, val] of Object.entries(res.headers)) {
              if (typeof val === "string") {
                headers[key.toLowerCase()] = val;
              } else if (Array.isArray(val) && val.length > 0) {
                headers[key.toLowerCase()] = val[0];
              }
            }

            let destroyed = false;
            const destroy = () => {
              if (destroyed) return;
              destroyed = true;
              cleanupAbortListener();
              try {
                res.destroy();
              } catch {
                // idempotent
              }
              try {
                req?.destroy();
              } catch {
                // idempotent
              }
            };

            res.on("close", () => {
              cleanupAbortListener();
            });

            res.on("error", () => {
              cleanupAbortListener();
            });

            res.on("end", () => {
              cleanupAbortListener();
            });

            safeResolve({
              statusCode: res.statusCode || 0,
              headers,
              body: res,
              destroy,
            });
          },
        );
      } catch (reqInitErr) {
        cleanupAbortListener();
        safeReject(
          new GeminiAdapterError(
            `HTTPS request initialization failed: ${reqInitErr instanceof Error ? reqInitErr.message : String(reqInitErr)}`,
          ),
        );
        return;
      }

      req.on("error", (err: Error) => {
        cleanupAbortListener();
        safeReject(new GeminiAdapterError(`HTTPS request error: ${err.message}`));
      });

      req.on("close", () => {
        cleanupAbortListener();
      });

      req.end();
    });
  }
}

// ============================================================================
// 6. ASYNC MUTEX (CONCURRENCY SERIALIZER = 1)
// ============================================================================

class AsyncMutex {
  private current: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void = () => {};
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.current;
    this.current = next;

    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

const geminiCallMutex = new AsyncMutex();

// ============================================================================
// 7. VIDEO UPLOAD TRANSPORT WITH GEMINI FILES API
// ============================================================================

export type UploadedVideoRef = {
  mimeType: AllowedVideoMimeType;
  fileUri: string;
  fileName?: string;
};

export interface VideoUploadTransport {
  prepareVideo(
    videoUrl: string,
    durationSeconds: number,
  ): Promise<UploadedVideoRef>;
  cleanup?(videoRef: UploadedVideoRef): Promise<void>;
}

export type DefaultVideoUploadTransportOptions = {
  apiKey?: string;
  allowedHosts?: string[];
  aiClient?: GoogleGenAI;
  dnsLookupFn?: typeof dns.lookup;
  /**
   * SafeDownloader injection: Chỉ dành riêng cho unit test hoặc trusted dependency injection nội bộ.
   * Đây là trusted internal dependency, tuyệt đối KHÔNG nhận từ client request hay untrusted user input.
   */
  downloader?: SafeDownloader;
  downloadTimeoutMs?: number;
  idleTimeoutMs?: number;
  uploadTimeoutMs?: number;
  fileGetTimeoutMs?: number;
  filePollTimeoutMs?: number;
  cleanupTimeoutMs?: number;
};

export class DefaultVideoUploadTransport implements VideoUploadTransport {
  private apiKey: string;
  private allowedHosts: string[];
  private aiClient?: GoogleGenAI;
  private dnsLookupFn?: typeof dns.lookup;
  private downloader: SafeDownloader;
  private downloadTimeoutMs: number;
  private idleTimeoutMs: number;
  private uploadTimeoutMs: number;
  private fileGetTimeoutMs: number;
  private filePollTimeoutMs: number;
  private cleanupTimeoutMs: number;

  constructor(options?: DefaultVideoUploadTransportOptions) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY?.trim() || "";
    this.allowedHosts = normalizeAllowedHosts(
      options?.allowedHosts ?? process.env.VIDEO_SOURCE_ALLOWED_HOSTS,
    );
    this.aiClient = options?.aiClient;
    this.dnsLookupFn = options?.dnsLookupFn;
    // Default production path bắt buộc sử dụng NodeSafeDownloader có DNS pinning.
    // Injected downloader chỉ dùng cho unit test hoặc trusted internal dependency injection.
    this.downloader = options?.downloader ?? new NodeSafeDownloader();
    this.downloadTimeoutMs =
      options?.downloadTimeoutMs ?? DEFAULT_DOWNLOAD_TIMEOUT_MS;
    this.idleTimeoutMs = options?.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
    this.uploadTimeoutMs =
      options?.uploadTimeoutMs ?? DEFAULT_UPLOAD_TIMEOUT_MS;
    this.fileGetTimeoutMs =
      options?.fileGetTimeoutMs ?? DEFAULT_FILE_GET_TIMEOUT_MS;
    this.filePollTimeoutMs =
      options?.filePollTimeoutMs ?? DEFAULT_FILE_POLL_TIMEOUT_MS;
    this.cleanupTimeoutMs =
      options?.cleanupTimeoutMs ?? DEFAULT_CLEANUP_TIMEOUT_MS;
  }

  async prepareVideo(
    videoUrl: string,
    durationSeconds: number,
  ): Promise<UploadedVideoRef> {
    if (durationSeconds < 15 || durationSeconds > 60) {
      throw new GeminiAdapterError(
        `Invalid video duration: ${durationSeconds}s. Must be between 15 and 60 seconds.`,
      );
    }

    if (!this.apiKey) {
      throw new GeminiAdapterError("GEMINI_API_KEY is not configured");
    }

    // 1. Fail-closed: Bắt buộc phải có allowlist không rỗng
    if (!this.allowedHosts || this.allowedHosts.length === 0) {
      throw new GeminiAdapterError(
        "VIDEO_SOURCE_ALLOWED_HOSTS is not configured or empty. Transport requires an explicit non-empty host allowlist.",
      );
    }

    // 2. Validate URL ban đầu: HTTPS bắt buộc, host thuộc allowlist
    const initialUrl = validateSafeVideoUrl(videoUrl, {
      allowedHosts: this.allowedHosts,
      allowHttp: false,
    });

    // 3. Download an toàn: Pin IP DNS, absolute deadline bao phủ DNS + redirects + body stream, giới hạn 50MB
    const { buffer, mimeType } = await this.safeDownload(initialUrl);

    // 4. Upload lên Gemini Files API thật có timeout kèm client-side AbortSignal (@google/genai 2.28.0 UploadFileConfig)
    // Ghi chú: AbortSignal hủy request ở phía client HTTP; theo tài liệu SDK, việc hủy phía client
    // không đảm bảo service Gemini dừng xử lý và vẫn có thể phát sinh usage.
    // Nếu upload timeout trước khi SDK nhận được fileName thì không thể gọi files.delete.
    const ai = this.aiClient || new GoogleGenAI({ apiKey: this.apiKey });
    const blob = new Blob([buffer as unknown as BlobPart], { type: mimeType });

    let uploadResult: {
      name?: string;
      uri?: string;
      state?: string;
      error?: { message?: string };
    };

    const uploadAbortController = new AbortController();
    try {
      uploadResult = await withTimeout(
        ai.files.upload({
          file: blob,
          config: {
            mimeType,
            abortSignal: uploadAbortController.signal,
          },
        }),
        this.uploadTimeoutMs,
        "Gemini Files API upload",
        uploadAbortController,
      );
    } catch (err) {
      if (isQuotaOrRateLimitError(err)) {
        throw new GeminiRateLimitError(
          "Gemini quota/rate-limit reached during Files API upload.",
        );
      }
      if (err instanceof GeminiAdapterError) {
        throw err;
      }
      throw new GeminiAdapterError(
        `Gemini Files API upload failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // NGAY KHI upload trả về kết quả: lưu fileName làm cleanup candidate nếu có
    let candidateFileName: string | undefined;
    if (
      uploadResult &&
      typeof uploadResult.name === "string" &&
      uploadResult.name.trim()
    ) {
      candidateFileName = uploadResult.name.trim();
    }

    // Bao toàn bộ xử lý sau upload trong try/catch để đảm bảo cleanup candidateFileName nếu có bất kỳ lỗi nào
    try {
      if (!uploadResult || !uploadResult.name || !uploadResult.uri) {
        throw new GeminiAdapterError(
          "Gemini Files API upload did not return a valid file URI",
        );
      }

      // Thẩm định nghiêm ngặt định dạng URI trả về từ Files API (ném lỗi nếu invalid hoặc arbitrary HTTPS URL)
      const fileUri = validateGeminiFileUri(uploadResult.uri);
      const fileName = uploadResult.name;

      // Polling trạng thái cho đến khi file ACTIVE (ném lỗi nếu FAILED, get timeout, hoặc poll deadline timeout)
      await this.pollFileReady(ai, fileName);

      // Chuyển giao quyền sở hữu (ownership transferred to caller):
      // Gán candidateFileName = undefined để không bị delete trong catch của prepareVideo
      candidateFileName = undefined;

      return {
        fileUri,
        fileName,
        mimeType,
      };
    } catch (postUploadErr) {
      if (candidateFileName) {
        try {
          const deleteAbortController = new AbortController();
          await withTimeout(
            ai.files.delete({
              name: candidateFileName,
              config: { abortSignal: deleteAbortController.signal },
            }),
            this.cleanupTimeoutMs,
            "Gemini Files API cleanup after post-upload failure",
            deleteAbortController,
          );
        } catch {
          // Best-effort cleanup: không che giấu lỗi chính
        }
      }
      throw postUploadErr;
    }
  }

  async cleanup(videoRef: UploadedVideoRef): Promise<void> {
    if (!videoRef || !videoRef.fileName || !this.apiKey) return;
    try {
      const ai = this.aiClient || new GoogleGenAI({ apiKey: this.apiKey });
      const deleteAbortController = new AbortController();
      await withTimeout(
        ai.files.delete({
          name: videoRef.fileName,
          config: { abortSignal: deleteAbortController.signal },
        }),
        this.cleanupTimeoutMs,
        "Gemini Files API cleanup",
        deleteAbortController,
      );
    } catch {
      // Dọn dẹp với cơ chế best-effort
    }
  }

  private async safeDownload(
    targetUrl: URL,
  ): Promise<{ buffer: Uint8Array; mimeType: AllowedVideoMimeType }> {
    const startTime = Date.now();
    const absoluteDeadline = startTime + this.downloadTimeoutMs;
    const abortController = new AbortController();
    const defaultTimeoutMessage = `Video download timed out after ${this.downloadTimeoutMs}ms (overall deadline exceeded)`;
    let timedOut = false;
    let timeoutMessage = "";
    let downloadResp: DownloadResponse | undefined;

    // Absolute deadline timer: Duy nhất 1 timer bao phủ toàn bộ:
    // DNS lookup -> connect -> TLS -> response headers -> mọi redirects -> toàn bộ body stream.
    const masterTimer = setTimeout(() => {
      timedOut = true;
      timeoutMessage = defaultTimeoutMessage;
      abortController.abort();
      if (downloadResp) downloadResp.destroy();
    }, this.downloadTimeoutMs);

    let redirectCount = 0;
    const maxRedirects = 3;
    let currentUrl = targetUrl;

    try {
      while (redirectCount <= maxRedirects) {
        const remainingBeforeDns = absoluteDeadline - Date.now();
        if (
          remainingBeforeDns <= 0 ||
          timedOut ||
          abortController.signal.aborted
        ) {
          throw new GeminiAdapterError(
            timeoutMessage || defaultTimeoutMessage,
          );
        }

        // 1. Phân giải DNS với timeout bọc theo remainingBeforeDns
        let pinnedIp: string;
        try {
          pinnedIp = await withTimeout(
            resolveAndPinHost(currentUrl.hostname, this.dnsLookupFn),
            remainingBeforeDns,
            `DNS lookup for host '${currentUrl.hostname}'`,
            abortController,
          );
        } catch (dnsErr) {
          if (Date.now() >= absoluteDeadline || timedOut || abortController.signal.aborted) {
            throw new GeminiAdapterError(
              timeoutMessage ||
                `Video download timed out after ${this.downloadTimeoutMs}ms (DNS lookup exceeded deadline)`,
            );
          }
          throw dnsErr;
        }

        const remainingBeforeDownload = absoluteDeadline - Date.now();
        if (
          remainingBeforeDownload <= 0 ||
          timedOut ||
          abortController.signal.aborted
        ) {
          throw new GeminiAdapterError(
            timeoutMessage || defaultTimeoutMessage,
          );
        }

        // 2. Thiết lập idle timer cho stream (chỉ kích hoạt khi this.idleTimeoutMs < remainingForIdle)
        let idleTimerId: NodeJS.Timeout | undefined;
        const resetIdleTimer = () => {
          if (idleTimerId) {
            clearTimeout(idleTimerId);
            idleTimerId = undefined;
          }
          if (timedOut || abortController.signal.aborted) return;
          const remainingForIdle = absoluteDeadline - Date.now();
          // 1 & 2. Nếu remainingForIdle <= this.idleTimeoutMs, master absolute deadline đã chịu trách nhiệm timeout.
          // Không tạo idle timer riêng trong trường hợp này.
          if (remainingForIdle <= this.idleTimeoutMs) {
            return;
          }
          // 3. Chỉ tạo idle timer với thông báo "stream stalled" khi this.idleTimeoutMs < remainingForIdle
          idleTimerId = setTimeout(() => {
            // 4 & 5. Không ghi đè timeoutMessage sau khi timedOut đã true hoặc đã chạm deadline; master deadline luôn ưu tiên
            if (timedOut || Date.now() >= absoluteDeadline) {
              return;
            }
            timedOut = true;
            timeoutMessage = `Video download stream stalled (idle timeout after ${this.idleTimeoutMs}ms)`;
            abortController.abort();
            if (downloadResp) downloadResp.destroy();
          }, this.idleTimeoutMs);
        };

        resetIdleTimer();

        // 3. Shared abort promise cho hop hiện tại (được đăng ký duy nhất 1 lần, loại bỏ nguy cơ memory leak)
        let onAbort: (() => void) | undefined;
        const hopAbortPromise = new Promise<never>((_, reject) => {
          if (timedOut || abortController.signal.aborted) {
            reject(
              new GeminiAdapterError(
                timeoutMessage || defaultTimeoutMessage,
              ),
            );
            return;
          }
          onAbort = () => {
            reject(
              new GeminiAdapterError(
                timeoutMessage || defaultTimeoutMessage,
              ),
            );
          };
          abortController.signal.addEventListener("abort", onAbort, {
            once: true,
          });
        });

        try {
          const downloadPromise = this.downloader.download(currentUrl, {
            pinnedIp,
            overallTimeoutMs: remainingBeforeDownload,
            idleTimeoutMs: this.idleTimeoutMs,
            maxSizeBytes: MAX_VIDEO_FILE_SIZE_BYTES,
            signal: abortController.signal,
          });

          downloadResp = await Promise.race([downloadPromise, hopAbortPromise]);

          // 4. Xử lý Redirect an toàn (không reset overall deadline, kế thừa remaining time)
          if ([301, 302, 303, 307, 308].includes(downloadResp.statusCode)) {
            const location = downloadResp.headers["location"];
            downloadResp.destroy();
            downloadResp = undefined;

            redirectCount++;
            if (redirectCount > maxRedirects) {
              throw new GeminiAdapterError("Too many redirects (max 3)");
            }

            if (!location) {
              throw new GeminiAdapterError(
                "Redirect response missing Location header",
              );
            }

            // Không forward cookie hoặc Authorization header qua redirect
            const nextUrl = new URL(location, currentUrl);

            // Kiểm tra URL và allowlist tại mỗi hop
            validateSafeVideoUrl(nextUrl.toString(), {
              allowedHosts: this.allowedHosts,
              allowHttp: false,
            });

            currentUrl = nextUrl;
            continue;
          }

          if (downloadResp.statusCode < 200 || downloadResp.statusCode >= 300) {
            downloadResp.destroy();
            throw new GeminiAdapterError(
              `Video download failed with HTTP status ${downloadResp.statusCode}`,
            );
          }

          // 5. Thẩm định Content-Type
          const contentType = downloadResp.headers["content-type"]
            ?.split(";")[0]
            ?.trim()
            ?.toLowerCase();
          if (
            !contentType ||
            !ALLOWED_VIDEO_MIME_TYPES.includes(
              contentType as AllowedVideoMimeType,
            )
          ) {
            downloadResp.destroy();
            throw new GeminiAdapterError(
              `Invalid video MIME type: '${contentType || "unknown"}'. Only video/mp4, video/quicktime, video/webm allowed.`,
            );
          }
          const mimeType = contentType as AllowedVideoMimeType;

          // 6. Thẩm định Content-Length nếu header tồn tại
          const contentLengthHeader = downloadResp.headers["content-length"];
          if (contentLengthHeader) {
            const contentLength = parseInt(contentLengthHeader, 10);
            if (contentLength > MAX_VIDEO_FILE_SIZE_BYTES) {
              downloadResp.destroy();
              throw new GeminiAdapterError(
                `Video file size (${contentLength} bytes) exceeds limit of 50MB`,
              );
            }
          }

          // 7. Đọc stream body: Sử dụng hopAbortPromise duy nhất, KHÔNG tạo abort listener cho từng chunk
          const chunks: Uint8Array[] = [];
          let totalBytes = 0;
          const iterator = downloadResp.body[Symbol.asyncIterator]();

          try {
            while (true) {
              if (timedOut || abortController.signal.aborted) {
                throw new GeminiAdapterError(
                  timeoutMessage || defaultTimeoutMessage,
                );
              }

              const nextResult = await Promise.race([
                iterator.next(),
                hopAbortPromise,
              ]);

              if (nextResult.done) break;
              const chunk = nextResult.value;
              resetIdleTimer();
              totalBytes += chunk.length;
              if (totalBytes > MAX_VIDEO_FILE_SIZE_BYTES) {
                downloadResp.destroy();
                throw new GeminiAdapterError(
                  "Video stream exceeded maximum allowed size of 50MB",
                );
              }
              chunks.push(chunk);
            }
          } finally {
            if (typeof iterator.return === "function") {
              try {
                await iterator.return();
              } catch {
                // Ignore iterator return close error
              }
            }
          }

          if (timedOut || abortController.signal.aborted) {
            throw new GeminiAdapterError(
              timeoutMessage || defaultTimeoutMessage,
            );
          }

          const combined = new Uint8Array(totalBytes);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }

          return { buffer: combined, mimeType };
        } finally {
          if (idleTimerId) clearTimeout(idleTimerId);
          if (onAbort) {
            abortController.signal.removeEventListener("abort", onAbort);
          }
        }
      }
    } catch (err) {
      if (Date.now() >= absoluteDeadline) {
        throw new GeminiAdapterError(defaultTimeoutMessage);
      }
      if (timedOut || abortController.signal.aborted) {
        throw new GeminiAdapterError(timeoutMessage || defaultTimeoutMessage);
      }
      if (err instanceof GeminiAdapterError) {
        throw err;
      }
      throw new GeminiAdapterError(
        `Failed to download video: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      clearTimeout(masterTimer);
      if (downloadResp) {
        downloadResp.destroy();
      }
    }

    throw new GeminiAdapterError("Failed to download video: redirect loop");
  }

  private async pollFileReady(
    ai: GoogleGenAI,
    fileName: string,
  ): Promise<void> {
    const startTime = Date.now();
    const intervalMs = 1_000;

    while (Date.now() - startTime < this.filePollTimeoutMs) {
      let file: { state?: string; error?: { message?: string } };
      try {
        const getAbortController = new AbortController();
        file = await withTimeout(
          ai.files.get({
            name: fileName,
            config: { abortSignal: getAbortController.signal },
          }),
          this.fileGetTimeoutMs,
          "Gemini Files API get file status",
          getAbortController,
        );
      } catch (err) {
        if (isQuotaOrRateLimitError(err)) {
          throw new GeminiRateLimitError(
            "Gemini quota/rate-limit reached during Files API status polling.",
          );
        }
        if (err instanceof GeminiAdapterError) {
          throw err;
        }
        throw new GeminiAdapterError(
          `Failed to get file status from Gemini Files API: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      if (file.state === "ACTIVE") {
        return;
      }
      if (file.state === "FAILED") {
        throw new GeminiAdapterError(
          `Gemini Files API video processing failed: ${file.error?.message || "state=FAILED"}`,
        );
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new GeminiAdapterError(
      `Gemini Files API video processing timed out after ${this.filePollTimeoutMs}ms`,
    );
  }
}

// ============================================================================
// 8. CONCRETE VIDEO ANALYSIS ADAPTER
// ============================================================================

export type GeminiModelInvoker = (params: {
  model: string;
  systemInstruction?: string;
  contents: unknown[];
  responseJsonSchema: unknown;
}) => Promise<string>;

export type GeminiVideoAdapterOptions = {
  apiKey?: string;
  modelName?: string;
  transport?: VideoUploadTransport;
  invoker?: GeminiModelInvoker;
  modelTimeoutMs?: number;
  cleanupTimeoutMs?: number;
};

export class GeminiVideoAnalysisAdapter implements VideoAnalysisAdapter {
  private apiKey: string;
  private modelName: string;
  private transport: VideoUploadTransport;
  private invoker?: GeminiModelInvoker;
  private modelTimeoutMs: number;
  private cleanupTimeoutMs: number;

  constructor(options?: GeminiVideoAdapterOptions) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY?.trim() || "";
    const envModel = process.env.GEMINI_VIDEO_ANALYSIS_MODEL?.trim();
    const model = options?.modelName || envModel;
    if (!model) {
      throw new GeminiAdapterError(
        "GEMINI_VIDEO_ANALYSIS_MODEL is not configured. Specify model in environment or adapter options.",
      );
    }
    this.modelName = model;
    this.transport =
      options?.transport ||
      new DefaultVideoUploadTransport({ apiKey: this.apiKey });
    this.invoker = options?.invoker;
    this.modelTimeoutMs = options?.modelTimeoutMs ?? DEFAULT_MODEL_TIMEOUT_MS;
    this.cleanupTimeoutMs =
      options?.cleanupTimeoutMs ?? DEFAULT_CLEANUP_TIMEOUT_MS;
  }

  async analyze(request: VideoAnalysisRequest): Promise<unknown> {
    return geminiCallMutex.runExclusive(async () => {
      let videoRef: UploadedVideoRef | undefined;
      try {
        videoRef = await this.transport.prepareVideo(
          request.video.videoUrl,
          request.video.durationSeconds,
        );

        // Runtime validation của transport output (không chỉ tin tưởng type TS)
        if (!videoRef || typeof videoRef !== "object") {
          throw new GeminiAdapterError(
            "Transport returned invalid video reference",
          );
        }

        // Validate Gemini file URI nghiêm ngặt (chặn arbitrary HTTPS URL)
        validateGeminiFileUri(videoRef.fileUri);

        if (
          !ALLOWED_VIDEO_MIME_TYPES.includes(
            videoRef.mimeType as AllowedVideoMimeType,
          )
        ) {
          throw new GeminiAdapterError(
            `Unsupported video MIME type returned by transport: ${videoRef.mimeType}`,
          );
        }

        let rawResponseText: string;

        if (this.invoker) {
          rawResponseText = await withTimeout(
            this.invoker({
              model: this.modelName,
              systemInstruction: request.system,
              contents: [
                {
                  fileData: {
                    fileUri: videoRef.fileUri,
                    mimeType: videoRef.mimeType,
                  },
                },
                { text: request.user },
              ],
              responseJsonSchema: request.responseJsonSchema,
            }),
            this.modelTimeoutMs,
            "Gemini analysis model call",
          );
        } else {
          if (!this.apiKey) {
            throw new GeminiAdapterError("GEMINI_API_KEY is not configured");
          }

          const ai = new GoogleGenAI({ apiKey: this.apiKey });
          const contentParts = [
            {
              fileData: {
                fileUri: videoRef.fileUri,
                mimeType: videoRef.mimeType,
              },
            },
            { text: request.user },
          ];

          const modelAbortController = new AbortController();
          const response = await withTimeout(
            ai.models.generateContent({
              model: this.modelName,
              contents: contentParts,
              config: {
                systemInstruction: request.system,
                responseMimeType: "application/json",
                responseSchema:
                  request.responseJsonSchema as Record<string, unknown>,
                temperature: 0.1,
                abortSignal: modelAbortController.signal,
              },
            }),
            this.modelTimeoutMs,
            "Gemini analysis model generateContent",
            modelAbortController,
          );

          rawResponseText = response.text || "";
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawResponseText);
        } catch {
          throw new GeminiAdapterError(
            "Gemini response could not be parsed as JSON.",
          );
        }

        // Schema validation - fail-fast không tự retry lượt thứ hai
        const validated = videoAnalysisSchema.safeParse(parsedJson);
        if (!validated.success) {
          throw new GeminiAdapterError(
            `Gemini analysis output failed schema contract: ${validated.error.message}`,
          );
        }

        return validated.data;
      } catch (err) {
        if (isQuotaOrRateLimitError(err)) {
          throw new GeminiRateLimitError(
            "Gemini quota/rate-limit reached during video analysis. Halting without auto-retry.",
          );
        }
        if (err instanceof GeminiAdapterError) {
          throw err;
        }
        const message = err instanceof Error ? err.message : String(err);
        throw new GeminiAdapterError(message);
      } finally {
        if (videoRef && this.transport.cleanup) {
          try {
            await withTimeout(
              this.transport.cleanup(videoRef),
              this.cleanupTimeoutMs,
              "Video transport cleanup",
            );
          } catch {
            // Dọn dẹp tài nguyên best-effort
          }
        }
      }
    });
  }
}

// ============================================================================
// 9. CONCRETE VIDEO GENERATION ADAPTER
// ============================================================================

export class GeminiVideoGenerationAdapter implements VideoGenerationAdapter {
  private apiKey: string;
  private modelName: string;
  private invoker?: GeminiModelInvoker;
  private modelTimeoutMs: number;

  constructor(options?: {
    apiKey?: string;
    modelName?: string;
    invoker?: GeminiModelInvoker;
    modelTimeoutMs?: number;
  }) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY?.trim() || "";
    const envModel = process.env.GEMINI_VIDEO_GENERATION_MODEL?.trim();
    const model = options?.modelName || envModel;
    if (!model) {
      throw new GeminiAdapterError(
        "GEMINI_VIDEO_GENERATION_MODEL is not configured. Specify model in environment or adapter options.",
      );
    }
    this.modelName = model;
    this.invoker = options?.invoker;
    this.modelTimeoutMs = options?.modelTimeoutMs ?? DEFAULT_MODEL_TIMEOUT_MS;
  }

  async generate(request: VideoGenerationRequest): Promise<unknown> {
    return geminiCallMutex.runExclusive(async () => {
      try {
        let rawResponseText: string;

        if (this.invoker) {
          rawResponseText = await withTimeout(
            this.invoker({
              model: this.modelName,
              systemInstruction: request.system,
              contents: [{ text: request.user }],
              responseJsonSchema: request.responseJsonSchema,
            }),
            this.modelTimeoutMs,
            "Gemini generation model call",
          );
        } else {
          if (!this.apiKey) {
            throw new GeminiAdapterError("GEMINI_API_KEY is not configured");
          }

          const ai = new GoogleGenAI({ apiKey: this.apiKey });
          const modelAbortController = new AbortController();
          const response = await withTimeout(
            ai.models.generateContent({
              model: this.modelName,
              contents: [{ text: request.user }],
              config: {
                systemInstruction: request.system,
                responseMimeType: "application/json",
                responseSchema:
                  request.responseJsonSchema as Record<string, unknown>,
                temperature: 0.2,
                abortSignal: modelAbortController.signal,
              },
            }),
            this.modelTimeoutMs,
            "Gemini generation model generateContent",
            modelAbortController,
          );

          rawResponseText = response.text || "";
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawResponseText);
        } catch {
          throw new GeminiAdapterError(
            "Gemini response could not be parsed as JSON.",
          );
        }

        // Schema validation - fail-fast không tự retry lượt thứ hai
        const validated = campaignVideoScriptSchema.safeParse(parsedJson);
        if (!validated.success) {
          throw new GeminiAdapterError(
            `Gemini script generation output failed schema contract: ${validated.error.message}`,
          );
        }

        return validated.data;
      } catch (err) {
        if (isQuotaOrRateLimitError(err)) {
          throw new GeminiRateLimitError(
            "Gemini quota/rate-limit reached during script generation. Halting without auto-retry.",
          );
        }
        if (err instanceof GeminiAdapterError) {
          throw err;
        }
        const message = err instanceof Error ? err.message : String(err);
        throw new GeminiAdapterError(message);
      }
    });
  }
}
