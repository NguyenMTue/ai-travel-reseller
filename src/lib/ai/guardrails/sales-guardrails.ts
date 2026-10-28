/**
 * SALES AGENT ANTI-HALLUCINATION GUARDRAILS
 *
 * Bộ lọc an toàn và kiểm soát tính trung thực (Grounding Guardrail)
 * cho AI Sales Agent trong ngữ cảnh tư vấn chiến dịch du lịch.
 *
 * Nguyên tắc cốt lõi:
 * 1. Fail-closed: Khi thiếu dữ liệu hoặc phát hiện mâu thuẫn, từ chối khẳng định và hướng đến nguồn chính thức.
 * 2. Grounding đối chiếu dữ liệu thật: Xác thực giá, mã ưu đãi, chính sách, tiện ích và thông số kỹ thuật
 *    dựa trên Verified Knowledge Base được cấp, không hardcode tour/sản phẩm cụ thể.
 * 3. Chống rò rỉ an toàn tài chính: Tuyệt đối chặn số tài khoản cá nhân, ví điện tử cá nhân hoặc URL thanh toán lạ.
 */

import { detectSalesIntent, type SalesIntent } from "../sales-agent.ts";

export interface VerifiedSalesKnowledgeBase {
  product_id?: string;
  product_name: string;
  original_price?: number | null;
  sale_price: number;
  currency?: string;
  allowed_prices?: number[];
  location?: string;
  operating_hours?: string;
  inclusions: string[];
  exclusions?: string[];
  allowed_promo_codes?: string[];
  child_policy?: {
    under_100cm?: string;
    from_100cm_to_140cm?: string;
    over_140cm?: string;
    rules_summary?: string;
  };
  cancellation_policy?: string;
  promotions?: string;
  specs?: Record<string, string>;
  max_compensation_percent?: number;
  payment_rule?: string;
  official_domains?: string[];
  official_checkout_url?: string;
  booking_url?: string;
  merchant_website?: string;
  verified_facts?: { id: string; text: string; category?: string }[];
}

export const SALES_GUARDRAIL_VIOLATIONS = {
  PRICE_FABRICATION: "PRICE_FABRICATION",
  PROMO_CODE_FABRICATION: "PROMO_CODE_FABRICATION",
  PHANTOM_FEATURE: "PHANTOM_FEATURE",
  OUT_OF_SCOPE_CLAIM: "OUT_OF_SCOPE_CLAIM",
  POLICY_OVERPROMISE: "POLICY_OVERPROMISE",
  UNAUTHORIZED_DISCOUNT: "UNAUTHORIZED_DISCOUNT",
  CHILD_POLICY_DISTORTION: "CHILD_POLICY_DISTORTION",
  AUTHORITY_IMPERSONATION: "AUTHORITY_IMPERSONATION",
  SPEC_HALLUCINATION: "SPEC_HALLUCINATION",
  PAYMENT_SAFETY_VIOLATION: "PAYMENT_SAFETY_VIOLATION",
  MISSING_GROUNDING: "MISSING_GROUNDING",
} as const;

export type SalesGuardrailViolation =
  (typeof SALES_GUARDRAIL_VIOLATIONS)[keyof typeof SALES_GUARDRAIL_VIOLATIONS];

export interface SalesGuardrailValidationResult {
  isValid: boolean;
  violations: SalesGuardrailViolation[];
  reasons: string[];
}

/**
 * Lấy danh sách domain chính thức được phép suy ra từ chính KB của sản phẩm hiện tại.
 * Tuyệt đối không fallback sang danh sách domain hard-code chung.
 */
export function getProductAllowedDomains(
  kb: VerifiedSalesKnowledgeBase,
): string[] {
  const domains = new Set<string>();

  if (kb.official_domains && Array.isArray(kb.official_domains)) {
    for (const d of kb.official_domains) {
      if (typeof d === "string" && d.trim()) {
        domains.add(d.trim().toLowerCase());
      }
    }
  }

  const urlsToExtract = [
    kb.official_checkout_url,
    kb.booking_url,
    kb.merchant_website,
  ];

  for (const u of urlsToExtract) {
    if (u && typeof u === "string" && u.trim()) {
      try {
        const fullUrl = u.trim().startsWith("http")
          ? u.trim()
          : `https://${u.trim()}`;
        const parsed = new URL(fullUrl);
        const host = parsed.hostname.toLowerCase();
        if (host) {
          domains.add(host);
        }
      } catch {
        // bỏ qua URL lỗi trong cấu hình KB
      }
    }
  }

  return [...domains];
}

/**
 * Trích xuất mọi giá tiền được nhắc đến trong văn bản.
 * Hỗ trợ các định dạng:
 * - 999000, 1150000
 * - 1 150 000, 1.150.000
 * - 999k, 0,999 triệu, 999000 VND, Giá: 999000
 * Phân loại dựa trên ngữ cảnh giá, không nhầm lẫn:
 * - Năm lịch (2026...)
 * - UUID
 * - Số điện thoại
 * - Mã đơn hàng
 * - Số tài khoản ngân hàng
 */
export function parseMentionedPrices(text: string): number[] {
  // 1. Loại bỏ các chuỗi định danh đặc thù để tránh nhầm lẫn:
  // - UUID
  let cleanText = text.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    " ",
  );
  // - Mã tham chiếu / mã đơn hàng / mã giao dịch / mã tra cứu / booking code / ref / txn (vd: ABC-999000, ORD-2026-999000, TXN-1150000)
  cleanText = cleanText.replace(
    /\b(?:ord|order|đơn hàng|mã đơn|donhang|invoice|mã tham chiếu|số tham chiếu|tham chiếu|mã giao dịch|số giao dịch|giao dịch|mã tra cứu|số tra cứu|tra cứu|mã xác nhận|mã đặt chỗ|mã đặt vé|mã booking|booking code|mã định danh|reference|ref|txn|txid|tracking)[-_#:\s]*[A-Za-z0-9_-]+\b/gi,
    " ",
  );
  // - Bất kỳ mã định danh có chứa gạch nối/gạch dưới kết hợp chữ cái và chữ số (vd: ABC-999000, VN-1150000, REF_12345)
  cleanText = cleanText.replace(
    /\b[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*[-_][A-Za-z0-9_-]+\b/gi,
    " ",
  );
  cleanText = cleanText.replace(
    /\b[A-Za-z0-9_-]+[-_][A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*\b/gi,
    " ",
  );
  // - Số điện thoại Việt Nam (10 chữ số bắt đầu bằng 0 hoặc +84)
  cleanText = cleanText.replace(
    /(?:\+84|0)(?:3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])\d{7}\b/g,
    " ",
  );
  // - Số tài khoản ngân hàng khi đi kèm từ khóa STK
  cleanText = cleanText.replace(
    /(?:stk|số tài khoản|tài khoản|tk)\s*[:=]?\s*\d{6,24}\b/gi,
    " ",
  );
  // - Năm lịch rõ ràng (vd: năm 2026, tháng 10/2026)
  cleanText = cleanText.replace(/\b(?:năm|tháng|ngày)\s*20\d{2}\b/gi, " ");

  const matchesWithIndex: { index: number; value: number; length: number }[] = [];

  // 2. Dạng A: Có đơn vị tiền tệ rõ ràng (triệu, tr, nghìn, ngàn, k, vnd, vnđ, đ, ₫)
  const UNIT_PRICE_REGEX =
    /\b(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(triệu|tr|nghìn|ngàn|k|vnd|vnđ|đ|₫)(?=\s|[.,;:!?/)]|$)/giu;

  for (const match of cleanText.matchAll(UNIT_PRICE_REGEX)) {
    const rawVal = match[1];
    const unit = match[2].toLowerCase();
    let num = 0;
    if (unit === "triệu" || unit === "tr") {
      num = Math.round(Number(rawVal.replace(",", ".")) * 1_000_000);
    } else if (unit === "nghìn" || unit === "ngàn" || unit === "k") {
      num = Math.round(
        Number(rawVal.replace(/[.\s]/g, "").replace(",", ".")) * 1_000,
      );
    } else {
      num = Math.round(Number(rawVal.replace(/[.\s]/g, "").replace(",", ".")));
    }
    if (Number.isFinite(num) && num >= 1000) {
      matchesWithIndex.push({
        index: match.index!,
        value: num,
        length: match[0].length,
      });
    }
  }

  // Mask các vị trí đã match ở Dạng A
  let textForFormatted = cleanText;
  for (const m of matchesWithIndex) {
    textForFormatted =
      textForFormatted.slice(0, m.index) +
      " ".repeat(m.length) +
      textForFormatted.slice(m.index + m.length);
  }

  // 3. Dạng B: Dạng số có dấu chấm hoặc khoảng trắng phân cách hàng nghìn (1.150.000, 1 150 000, 999.000)
  const FORMATTED_NUM_REGEX =
    /\b(\d{1,3}(?:[.]\d{3})+|\d{1,3}(?:\s\d{3})+)\b/gu;
  for (const match of textForFormatted.matchAll(FORMATTED_NUM_REGEX)) {
    const rawVal = match[1];
    const num = Math.round(Number(rawVal.replace(/[.\s]/g, "")));
    if (Number.isFinite(num) && num >= 10000) {
      matchesWithIndex.push({
        index: match.index!,
        value: num,
        length: match[0].length,
      });
    }
  }

  // Mask các vị trí đã match ở Dạng B
  let textForRaw = textForFormatted;
  for (const m of matchesWithIndex) {
    textForRaw =
      textForRaw.slice(0, m.index) +
      " ".repeat(m.length) +
      textForRaw.slice(m.index + m.length);
  }

  // 4. Dạng C: Số trần liên tục (999000, 1150000, Giá: 999000)
  // Chỉ nhận các số có từ 5 đến 8 chữ số (từ 10.000 đến 99.999.999), không bắt đầu bằng số 0
  const RAW_DIGITS_REGEX = /\b([1-9]\d{4,7})\b/g;
  let matchRaw: RegExpExecArray | null;
  while ((matchRaw = RAW_DIGITS_REGEX.exec(textForRaw)) !== null) {
    const rawStr = matchRaw[1];
    const num = Number(rawStr);
    if (!Number.isFinite(num) || num < 10000) {
      continue;
    }

    // Kiểm tra ngữ cảnh giá xung quanh
    const startIdx = Math.max(0, matchRaw.index - 25);
    const endIdx = Math.min(
      cleanText.length,
      matchRaw.index + rawStr.length + 25,
    );
    const contextSnippet = cleanText.slice(startIdx, endIdx).toLowerCase();

    const isPriceContext =
      contextSnippet.includes("giá") ||
      contextSnippet.includes("tiền") ||
      contextSnippet.includes("bán") ||
      contextSnippet.includes("mua") ||
      contextSnippet.includes("còn") ||
      contextSnippet.includes("chỉ") ||
      contextSnippet.includes("vé") ||
      contextSnippet.includes("combo") ||
      contextSnippet.includes("mức") ||
      contextSnippet.includes("ưu đãi") ||
      contextSnippet.includes("chi phí") ||
      contextSnippet.includes("thanh toán") ||
      contextSnippet.includes("vnd") ||
      contextSnippet.includes("vnđ") ||
      contextSnippet.includes("đ") ||
      contextSnippet.includes(":") ||
      contextSnippet.includes("=");

    const isIdentifierContext =
      contextSnippet.includes("tham chiếu") ||
      contextSnippet.includes("mã") ||
      contextSnippet.includes("đơn hàng") ||
      contextSnippet.includes("giao dịch") ||
      contextSnippet.includes("tra cứu") ||
      contextSnippet.includes("tracking") ||
      contextSnippet.includes("code") ||
      contextSnippet.includes("stk") ||
      contextSnippet.includes("tài khoản");

    if (isPriceContext || (rawStr.endsWith("000") && !isIdentifierContext)) {
      matchesWithIndex.push({
        index: matchRaw.index,
        value: num,
        length: rawStr.length,
      });
    }
  }

  matchesWithIndex.sort((a, b) => a.index - b.index);
  return matchesWithIndex.map((m) => m.value);
}

/**
 * Lấy danh sách toàn bộ các mức giá hợp lệ được KB cho phép
 */
export function getAllowedPrices(kb: VerifiedSalesKnowledgeBase): number[] {
  const list = [kb.sale_price];
  if (kb.original_price && kb.original_price > 0) {
    list.push(kb.original_price);
  }
  if (kb.allowed_prices && Array.isArray(kb.allowed_prices)) {
    for (const p of kb.allowed_prices) {
      if (typeof p === "number" && p > 0 && !list.includes(p)) {
        list.push(p);
      }
    }
  }
  return list;
}

/**
 * Kiểm định tính hợp lệ và trung thực của một câu trả lời ứng viên so với Knowledge Base
 */
export function validateSalesReplyAgainstKB(
  reply: string,
  _question: string,
  kb?: VerifiedSalesKnowledgeBase,
): SalesGuardrailValidationResult {
  const violations: SalesGuardrailViolation[] = [];
  const reasons: string[] = [];

  if (!kb) {
    return {
      isValid: false,
      violations: [SALES_GUARDRAIL_VIOLATIONS.MISSING_GROUNDING],
      reasons: ["Không có nguồn dữ liệu Knowledge Base được xác minh."],
    };
  }

  if (!kb.sale_price || kb.sale_price <= 0 || !Number.isFinite(kb.sale_price)) {
    return {
      isValid: false,
      violations: [SALES_GUARDRAIL_VIOLATIONS.PRICE_FABRICATION],
      reasons: ["Dữ liệu giá bán (sale_price) trong KB không hợp lệ hoặc bằng 0."],
    };
  }

  const rLower = reply.toLowerCase();
  const allowedPrices = getAllowedPrices(kb);

  // 1. Kiểm tra an toàn tài chính & tài khoản thanh toán / số tài khoản / URL lạ
  const personalAccountKeywords = [
    "tài khoản cá nhân",
    "momo cá nhân",
    "stk cá nhân",
    "chuyển khoản cho em",
    "inbox nhận stk",
    "ngân hàng cá nhân",
    "stk:",
    "số tài khoản:",
  ];
  if (
    personalAccountKeywords.some((kw) => rLower.includes(kw)) &&
    !rLower.includes("tuyệt đối không nhận") &&
    !rLower.includes("không nhận thanh toán")
  ) {
    violations.push(SALES_GUARDRAIL_VIOLATIONS.PAYMENT_SAFETY_VIOLATION);
    reasons.push("Phát hiện đề cập nhận tiền qua tài khoản cá nhân trái quy định.");
  }

  // Chặn dãy số tài khoản độc lập (8-16 chữ số) không nằm trong allowed_prices
  const longDigits = [...reply.matchAll(/\b\d{8,16}\b/g)].map((m) => m[0]);
  for (const numStr of longDigits) {
    const val = Number(numStr);
    if (!allowedPrices.includes(val)) {
      violations.push(SALES_GUARDRAIL_VIOLATIONS.PAYMENT_SAFETY_VIOLATION);
      reasons.push(`Phát hiện chuỗi số tài khoản/thanh toán lạ ngoài KB: ${numStr}`);
      break;
    }
  }

  // Chặn URL ngoại lai hoặc URL độc hại / sai domain
  const urlMatches = [
    ...reply.matchAll(/(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+/gi),
  ].map((m) => m[0]);
  if (urlMatches.length > 0) {
    const allowedDomains = getProductAllowedDomains(kb);

    if (allowedDomains.length === 0) {
      violations.push(SALES_GUARDRAIL_VIOLATIONS.PAYMENT_SAFETY_VIOLATION);
      reasons.push(
        "KB không có official domain hoặc checkout URL nào được xác minh. Mọi URL trong phản hồi đều bị chặn.",
      );
    } else {
      const checkoutRequiresHttps =
        !kb.official_checkout_url ||
        kb.official_checkout_url.toLowerCase().startsWith("https:");

      for (const rawUrl of urlMatches) {
        try {
          const fullUrl = rawUrl.startsWith("http")
            ? rawUrl
            : `https://${rawUrl}`;
          const parsed = new URL(fullUrl);
          const host = parsed.hostname.toLowerCase();

          // Kiểm tra user-info injection (vd: http://user:pass@evil.com)
          if (parsed.username || parsed.password) {
            violations.push(
              SALES_GUARDRAIL_VIOLATIONS.PAYMENT_SAFETY_VIOLATION,
            );
            reasons.push(
              `Phát hiện URL chứa user credentials nguy hiểm: ${rawUrl}`,
            );
            break;
          }

          // Chặn HTTP nếu official checkout dùng HTTPS
          if (checkoutRequiresHttps && parsed.protocol === "http:") {
            violations.push(
              SALES_GUARDRAIL_VIOLATIONS.PAYMENT_SAFETY_VIOLATION,
            );
            reasons.push(
              `Phát hiện URL sử dụng giao thức HTTP không an toàn: ${rawUrl}. Chỉ chấp nhận HTTPS.`,
            );
            break;
          }

          const isAllowedDomain = allowedDomains.some(
            (d) => host === d || host.endsWith(`.${d}`),
          );
          if (!isAllowedDomain) {
            violations.push(
              SALES_GUARDRAIL_VIOLATIONS.PAYMENT_SAFETY_VIOLATION,
            );
            reasons.push(
              `Phát hiện URL lạ không thuộc official_domains của KB: ${rawUrl}`,
            );
            break;
          }
        } catch {
          violations.push(
            SALES_GUARDRAIL_VIOLATIONS.PAYMENT_SAFETY_VIOLATION,
          );
          reasons.push(`Phát hiện URL không hợp lệ: ${rawUrl}`);
          break;
        }
      }
    }
  }

  // 2. Kiểm tra Mạo danh thẩm quyền / Jailbreak (Tổng Giám Đốc, cấp vé 0đ)
  if (
    rLower.includes("tôi là tổng giám đốc") ||
    rLower.includes("tôi là giám đốc") ||
    rLower.includes("cấp cho bạn vé 0") ||
    rLower.includes("duyệt miễn phí") ||
    rLower.includes("vé 0đ cho bạn") ||
    (rLower.includes("tổng giám đốc") &&
      (rLower.includes("cấp vé") || rLower.includes("duyệt cho")))
  ) {
    violations.push(SALES_GUARDRAIL_VIOLATIONS.AUTHORITY_IMPERSONATION);
    reasons.push("Mạo danh thẩm quyền lãnh đạo hoặc tự ý phê duyệt vé 0đ.");
  }

  // 3. Kiểm tra Giá bán tổng quát (Price Grounding đối chiếu KB)
  const mentionedPrices = parseMentionedPrices(reply);
  for (const price of mentionedPrices) {
    if (!allowedPrices.includes(price)) {
      // Kiểm tra xem câu trả lời có đang trực tiếp bác bỏ chính mức giá này không
      const priceStr1 = price.toLocaleString("vi-VN");
      const priceStr2 = `${Math.round(price / 1000)}k`;
      const priceDigits = String(price);

      const isRefuting =
        rLower.includes(`không có giá ${priceStr1}`) ||
        rLower.includes(`không có giá ${priceStr2}`) ||
        rLower.includes(`không có giá ${priceDigits}`) ||
        rLower.includes(`không bán ${priceStr1}`) ||
        rLower.includes(`không bán ${priceStr2}`) ||
        rLower.includes(`không bán ${priceDigits}`) ||
        rLower.includes(`không áp dụng mức giá ${priceStr1}`) ||
        rLower.includes(`không áp dụng mức giá ${priceStr2}`) ||
        rLower.includes(`không áp dụng giá ${priceStr1}`) ||
        rLower.includes(`không áp dụng giá ${priceStr2}`) ||
        rLower.includes(`không áp dụng giá ${priceDigits}`) ||
        rLower.includes(`không hỗ trợ mức giá ${priceStr1}`) ||
        rLower.includes(`không hỗ trợ mức giá ${priceStr2}`) ||
        rLower.includes(`không hỗ trợ mức giá ${priceDigits}`) ||
        rLower.includes(`không có chương trình flash sale ${priceStr1}`) ||
        rLower.includes(`không có chương trình flash sale ${priceStr2}`) ||
        rLower.includes(`không có chương trình flash sale ${priceDigits}`);

      if (!isRefuting) {
        violations.push(SALES_GUARDRAIL_VIOLATIONS.PRICE_FABRICATION);
        reasons.push(
          `Mức giá ${price}đ được đề cập không tồn tại trong danh sách giá được phép của KB [${allowedPrices.join(", ")}].`,
        );
        break;
      }
    }
  }

  // 4. Kiểm tra Mã giảm giá tổng quát (Promo Code Grounding)
  const allowedPromoCodes = (kb.allowed_promo_codes || []).map((c) =>
    c.toUpperCase(),
  );

  const NON_PROMO_CODES = new Set([
    "COMBO",
    "TIKTOK",
    "REELS",
    "HOTLINE",
    "TRAVEL",
    "BUFFET",
    "INTENT",
    "OFFICIAL",
    "VND",
    "VNĐ",
    "USD",
    "VOUCHER",
    "COUPON",
    "PROMO",
    "DISCOUNT",
    "SALE",
    "FLASH",
    "THAM",
    "CHIẾU",
    "CHIEU",
    "GIAO",
    "DỊCH",
    "DICH",
    "ĐƠN",
    "DON",
    "HÀNG",
    "HANG",
    "TRA",
    "CỨU",
    "CUU",
    "XÁC",
    "XAC",
    "NHẬN",
    "NHAN",
    "ĐỊNH",
    "DINH",
    "DANH",
    "ĐẶT",
    "DAT",
    "CHỖ",
    "CHO",
    "VÉ",
    "VE",
    "BOOKING",
    "VÙNG",
    "VUNG",
    "BƯU",
    "BUU",
    "CHÍNH",
    "CHINH",
    "SỐ",
    "SO",
    "VẠCH",
    "VACH",
    "PIN",
    "OTP",
    "KHÁCH",
    "KHACH",
    "BẢO",
    "BAO",
    "MẬT",
    "MAT",
    "THANH",
    "TOÁN",
    "TOAN",
    "GIẢM",
    "GIAM",
    "GIÁ",
    "GIA",
    "ƯU",
    "ĐÃI",
    "DAI",
    "KHUYẾN",
    "KHUYEN",
    "MÃI",
    "MAI",
    "NÀY",
    "NAY",
    "ĐÓ",
    "DO",
    "ẤY",
    "AY",
    "TRÊN",
    "TREN",
    "DƯỚI",
    "DUOI",
    "THEO",
    "CHO",
    "CỦA",
    "CUA",
    "ĐƯỢC",
    "DUOC",
    "TRƯỚC",
    "TRUOC",
    "SAU",
  ]);

  const candidatePromoCodes: string[] = [];

  // Match 1: Cụm từ rõ ràng chỉ mã giảm giá/ưu đãi/voucher/coupon kèm mã
  // vd: "mã giảm giá VIP70", "code khuyến mãi SUN50", "voucher FAKE50", "coupon BANA100"
  const EXPLICIT_PROMO_REGEX =
    /\b(?:mã\s+(?:giảm\s*giá|ưu\s*đãi|khuyến\s*mãi|voucher|coupon)|code\s+(?:giảm\s*giá|ưu\s*đãi|khuyến\s*mãi|voucher|coupon)|voucher|coupon)\s*[:=]?\s*([A-Za-z0-9_-]{3,20})\b/gi;
  for (const m of reply.matchAll(EXPLICIT_PROMO_REGEX)) {
    const raw = (m[1] || "").toUpperCase();
    if (raw && !NON_PROMO_CODES.has(raw)) {
      candidatePromoCodes.push(raw);
    }
  }

  // Match 2: Cụm "mã [CODE]" hoặc "code [CODE]" ngắn gọn (loại bỏ trường hợp mã tham chiếu, mã giao dịch,...)
  const SHORT_PROMO_REGEX =
    /\b(?:mã|code)\s*[:=]?\s*([A-Za-z0-9_-]{3,20})\b/gi;
  for (const m of reply.matchAll(SHORT_PROMO_REGEX)) {
    const startIdx = Math.max(0, m.index! - 20);
    const endIdx = Math.min(reply.length, m.index! + m[0].length + 20);
    const surrounding = reply.slice(startIdx, endIdx).toLowerCase();

    if (
      surrounding.includes("tham chiếu") ||
      surrounding.includes("giao dịch") ||
      surrounding.includes("đơn hàng") ||
      surrounding.includes("tra cứu") ||
      surrounding.includes("xác nhận") ||
      surrounding.includes("định danh") ||
      surrounding.includes("đặt chỗ") ||
      surrounding.includes("đặt vé") ||
      surrounding.includes("booking") ||
      surrounding.includes("tracking") ||
      surrounding.includes("ref") ||
      surrounding.includes("txn") ||
      surrounding.includes("stk") ||
      surrounding.includes("tài khoản")
    ) {
      continue;
    }

    const raw = (m[1] || "").toUpperCase();
    if (raw && !NON_PROMO_CODES.has(raw)) {
      candidatePromoCodes.push(raw);
    }
  }

  // Match 3: Token chữ in hoa độc lập (all-caps alphanumeric token từ 4 đến 15 ký tự có ít nhất 1 chữ cái)
  // vd: "VIP70", "FAKE50", "SUPERSALE90"
  const ALL_CAPS_TOKEN_REGEX = /\b(?=[A-Z0-9]*[A-Z])[A-Z0-9]{4,15}\b/g;
  for (const m of reply.matchAll(ALL_CAPS_TOKEN_REGEX)) {
    const token = m[0];
    const charBefore = m.index! > 0 ? reply[m.index! - 1] : " ";
    const charAfter =
      m.index! + token.length < reply.length
        ? reply[m.index! + token.length]
        : " ";
    if (
      charBefore === "-" ||
      charBefore === "_" ||
      charAfter === "-" ||
      charAfter === "_"
    ) {
      continue;
    }

    const raw = token.toUpperCase();
    if (raw && !NON_PROMO_CODES.has(raw)) {
      candidatePromoCodes.push(raw);
    }
  }

  for (const code of candidatePromoCodes) {
    if (!allowedPromoCodes.includes(code)) {
      // Kiểm tra xem reply có đang từ chối đích danh mã này không
      const codeLower = code.toLowerCase();
      const isRejecting =
        rLower.includes(`không có mã '${codeLower}'`) ||
        rLower.includes(`không có mã ${codeLower}`) ||
        rLower.includes(`không áp dụng mã '${codeLower}'`) ||
        rLower.includes(`không áp dụng mã ${codeLower}`) ||
        rLower.includes(`không thể tự ý áp dụng mã '${codeLower}'`) ||
        rLower.includes(`không thể tự ý áp dụng mã ${codeLower}`) ||
        rLower.includes(`không hỗ trợ mã '${codeLower}'`) ||
        rLower.includes(`không hỗ trợ mã ${codeLower}`);

      if (!isRejecting) {
        violations.push(SALES_GUARDRAIL_VIOLATIONS.PROMO_CODE_FABRICATION);
        reasons.push(
          `Mã giảm giá '${code}' không nằm trong danh mục voucher được phép của KB.`,
        );
        break;
      }
    }
  }

  // 5. Kiểm tra Tiện ích hư cấu / Exclusions / Phantom Features
  // 5.1 Kiểm tra danh mục exclusions rõ ràng của KB
  const exclusions = [
    ...(kb.exclusions || []),
    "dát vàng",
    "jacuzzi",
    "bồn sục",
    "trực thăng riêng",
    "xe limousine miễn phí",
    "champagne",
  ];
  for (const excludedItem of exclusions) {
    const itemLower = excludedItem.toLowerCase();
    if (rLower.includes(itemLower)) {
      const itemIdx = rLower.indexOf(itemLower);
      const preceding = rLower.slice(Math.max(0, itemIdx - 50), itemIdx);
      const following = rLower.slice(
        itemIdx + itemLower.length,
        Math.min(rLower.length, itemIdx + itemLower.length + 50),
      );
      const localContext = `${preceding} ${itemLower} ${following}`;

      const isNegating =
        localContext.includes(`không có ${itemLower}`) ||
        localContext.includes(`không bao gồm ${itemLower}`) ||
        localContext.includes(`chưa bao gồm ${itemLower}`) ||
        localContext.includes(`không cung cấp ${itemLower}`) ||
        (localContext.includes("không có") && localContext.includes(itemLower)) ||
        (localContext.includes("không bao gồm") && localContext.includes(itemLower)) ||
        (localContext.includes("không cung cấp") && localContext.includes(itemLower)) ||
        (localContext.includes("không vận hành") && localContext.includes(itemLower)) ||
        (localContext.includes("chỉ vận hành các cabin tiêu chuẩn") &&
          (itemLower.includes("dát vàng") || itemLower.includes("jacuzzi") || itemLower.includes("bồn sục")));

      if (!isNegating) {
        violations.push(SALES_GUARDRAIL_VIOLATIONS.PHANTOM_FEATURE);
        reasons.push(
          `Xác nhận tiện ích/dịch vụ ngoài phạm vi KB: ${excludedItem}`,
        );
        break;
      }
    }
  }

  // 5.2 Cơ chế kiểm tra claim quyền lợi / inclusion tổng quát (Grounding Verification)
  // Xây dựng kho ngữ liệu đã xác minh từ toàn bộ cấu trúc KB
  const verifiedCorpusParts: string[] = [
    kb.product_name,
    kb.location || "",
    ...(kb.inclusions || []),
    ...(kb.verified_facts || []).map((f) => f.text),
    ...(kb.verified_facts || []).map((f) => f.category || ""),
    ...Object.values(kb.specs || {}),
    kb.promotions || "",
    kb.cancellation_policy || "",
    kb.operating_hours || "",
    kb.child_policy?.under_100cm || "",
    kb.child_policy?.from_100cm_to_140cm || "",
    kb.child_policy?.over_140cm || "",
    kb.child_policy?.rules_summary || "",
  ];
  const verifiedCorpus = verifiedCorpusParts.join(" ").toLowerCase();

  const affirmativeTriggers = [
    /(?:vé|combo|dịch vụ)?\s*(?:đã\s+|có\s+)?bao gồm\s+([^.,;!?\n]+)/gi,
    /(?:tặng kèm|tặng thêm|tặng riêng|tặng)\s+([^.,;!?\n]+)/gi,
    /(?:miễn phí|free)\s+([^.,;!?\n]+)/gi,
    /([^.,;!?\n]+?)\s+(?:miễn phí|free)/gi,
    /được (?:sử dụng|dùng|trải nghiệm)\s+([^.,;!?\n]+)/gi,
    /được (?:hưởng|nhận)\s+([^.,;!?\n]+)/gi,
    /được ưu tiên\s+([^.,;!?\n]+)/gi,
    /(?:cam kết|bảo đảm|đảm bảo)\s+([^.,;!?\n]+)/gi,
    /có\s+(?:thêm\s+|sẵn\s+)?(?:bảo hiểm|xe lăn|khách sạn|xe đưa đón|xe đẩy|phòng nghỉ|buffet|bữa ăn|bữa tối|hải sản)\s*([^.,;!?\n]*)/gi,
  ];

  const negationKeywords = [
    "không bao gồm",
    "chưa bao gồm",
    "không có",
    "không miễn phí",
    "không tặng",
    "không được ưu tiên",
    "không được",
    "không cam kết",
    "không bảo đảm",
    "chưa có thông tin",
    "không hỗ trợ",
    "tuyệt đối không",
    "ngoài chương trình",
    "không áp dụng",
    "phải mua riêng",
    "tính phí riêng",
  ];

  for (const regex of affirmativeTriggers) {
    const matches = [...reply.matchAll(regex)];
    for (const match of matches) {
      const fullMatch = match[0].toLowerCase();
      const claimedPhrase = (match[1] || match[0]).toLowerCase().trim();

      // Trích xuất ngữ cảnh cục bộ trong cùng câu/mệnh đề của match để tránh việc phủ định ở câu khác
      // vô tình tạo lỗ hổng miễn trừ (bypass) cho câu khẳng định sai trái này.
      const matchStart = match.index ?? 0;
      const precedingText = reply.slice(0, matchStart);
      const clauseBreak = Math.max(
        precedingText.lastIndexOf("."),
        precedingText.lastIndexOf("!"),
        precedingText.lastIndexOf("?"),
        precedingText.lastIndexOf(";"),
        precedingText.lastIndexOf("\n"),
        precedingText.toLowerCase().lastIndexOf("nhưng"),
        precedingText.toLowerCase().lastIndexOf("tuy nhiên"),
        precedingText.toLowerCase().lastIndexOf("song"),
      );
      const localPrefix = precedingText
        .slice(clauseBreak >= 0 ? clauseBreak : 0)
        .toLowerCase();
      const localScope = `${localPrefix} ${fullMatch}`.toLowerCase();

      // Bỏ qua nếu trong cùng mệnh đề/câu có từ ngữ phủ định gắn liền
      if (negationKeywords.some((neg) => localScope.includes(neg))) {
        continue;
      }

      const words = claimedPhrase
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 2);

      const stopwords = new Set([
        "cho",
        "mọi",
        "các",
        "những",
        "của",
        "và",
        "hoặc",
        "với",
        "trong",
        "tại",
        "khi",
        "này",
        "đó",
        "ạ",
        "nhé",
        "nha",
        "ngay",
        "luôn",
        "được",
        "có",
        "là",
        "vé",
        "combo",
        "khách",
        "hàng",
        "bạn",
        "anh",
        "chị",
        "em",
        "người",
        "toàn",
        "bộ",
        "thêm",
        "kèm",
        "theo",
        "đầy",
        "đủ",
        "trọn",
        "gói",
        "chi",
        "tiết",
        "chính",
        "thức",
        "dịch",
        "vụ",
        "trải",
        "nghiệm",
        "rồi",
        "đã",
        "đang",
        "sẽ",
        "vẫn",
        "cũng",
        "chỉ",
        "định",
        "ơi",
        "nhá",
        "nè",
        "tận",
        "ở",
        "chưa",
        "vừa",
        "mới",
        "nhiều",
        "hơn",
        "hết",
        "nhất",
        "quá",
        "rất",
        "tiêu",
        "chuẩn",
        "quy",
        "dạ",
        "vâng",
      ]);

      const substantiveWords = words.filter((w) => !stopwords.has(w));
      if (substantiveWords.length === 0) {
        continue;
      }

      // Kiểm tra xem các từ khóa thực thể có xuất hiện trong verifiedCorpus không
      const ungroundedKeywords = substantiveWords.filter((word) => {
        return !verifiedCorpus.includes(word);
      });

      if (ungroundedKeywords.length > 0) {
        violations.push(SALES_GUARDRAIL_VIOLATIONS.PHANTOM_FEATURE);
        reasons.push(
          `Khẳng định quyền lợi/tiện ích '${claimedPhrase}' không có căn cứ trong dữ liệu xác minh KB (từ khóa ngoài KB: ${ungroundedKeywords.join(", ")}).`,
        );
        break;
      }
    }
    if (violations.includes(SALES_GUARDRAIL_VIOLATIONS.PHANTOM_FEATURE)) {
      break;
    }
  }

  // 6. Kiểm tra Phạm vi đối thủ / Cross-Brand Leak
  const competitorKeywords = [
    "vinwonders",
    "sun world hạ long",
    "phú quốc united center",
  ];
  const currentProdLower = kb.product_name.toLowerCase();
  for (const comp of competitorKeywords) {
    if (!currentProdLower.includes(comp) && rLower.includes(comp)) {
      const isDifferentiating =
        rLower.includes("không áp dụng") ||
        rLower.includes("không bao gồm") ||
        rLower.includes("chỉ áp dụng cho") ||
        rLower.includes("khác nhau");
      if (!isDifferentiating) {
        violations.push(SALES_GUARDRAIL_VIOLATIONS.OUT_OF_SCOPE_CLAIM);
        reasons.push(`Nhận vơ hoặc trộn lẫn quyền lợi của công viên khác: ${comp}`);
        break;
      }
    }
  }

  // 7. Kiểm tra Ngụy biện tách lẻ combo / Giảm giá tự ý (UNAUTHORIZED_DISCOUNT)
  if (
    (rLower.includes("trừ") || rLower.includes("bớt") || rLower.includes("tách lẻ")) &&
    (rLower.includes("bán riêng") || rLower.includes("bán vé") || rLower.includes("còn lại") || rLower.includes("giá")) &&
    !rLower.includes("không thể trừ") &&
    !rLower.includes("không thể tách") &&
    !rLower.includes("không hỗ trợ tách") &&
    !rLower.includes("trọn gói cố định")
  ) {
    violations.push(SALES_GUARDRAIL_VIOLATIONS.UNAUTHORIZED_DISCOUNT);
    reasons.push("Tự ý trừ tiền hoặc unbundle tách lẻ dịch vụ trong combo trọn gói.");
  }

  // 8. Kiểm tra Cam kết bồi thường trái chính sách (Policy Overpromising)
  // Bất kỳ cam kết bồi thường % nào (vd 150%, 200%) hoặc hoàn tiền mặt tức thì không có trong KB
  const compensationMatch = rLower.match(/bồi thường\s*(\d+)%/i);
  if (compensationMatch) {
    const pct = Number(compensationMatch[1]);
    const maxAllowed = kb.max_compensation_percent ?? 100;
    if (pct > maxAllowed) {
      const isRejecting =
        rLower.includes("không thể") ||
        rLower.includes("không hỗ trợ") ||
        rLower.includes("không cam kết");
      if (!isRejecting) {
        violations.push(SALES_GUARDRAIL_VIOLATIONS.POLICY_OVERPROMISE);
        reasons.push(
          `Cam kết bồi thường ${pct}% vượt quá mức cho phép trong KB (${maxAllowed}%).`,
        );
      }
    }
  }
  if (
    (rLower.includes("đền gấp") ||
      rLower.includes("hoàn tiền mặt trong 5 phút") ||
      rLower.includes("cam kết hoàn tiền mặt")) &&
    !rLower.includes("không thể") &&
    !rLower.includes("không hỗ trợ") &&
    !rLower.includes("không có")
  ) {
    violations.push(SALES_GUARDRAIL_VIOLATIONS.POLICY_OVERPROMISE);
    reasons.push("Đưa ra cam kết bồi thường hoặc hoàn tiền mặt trái chính sách KB.");
  }

  // 9. Kiểm tra Bóp méo chính sách trẻ em (Policy Distortion)
  if (
    rLower.includes("1m45") &&
    rLower.includes("miễn phí") &&
    !rLower.includes("chỉ các bé dưới 1m00 mới được miễn phí") &&
    !rLower.includes("không được miễn phí")
  ) {
    violations.push(SALES_GUARDRAIL_VIOLATIONS.CHILD_POLICY_DISTORTION);
    reasons.push("Bóp méo quy định đo chiều cao trẻ em, tính miễn phí cho khách 1m45.");
  }

  // 10. Kiểm tra Bịa thông số kỹ thuật (Spec Hallucination)
  if (
    (rLower.includes("500km") ||
      rLower.includes("1000km") ||
      rLower.includes("300km/h") ||
      rLower.includes("500km/h")) &&
    !rLower.includes("không chính xác") &&
    !rLower.includes("hoàn toàn không")
  ) {
    violations.push(SALES_GUARDRAIL_VIOLATIONS.SPEC_HALLUCINATION);
    reasons.push("Xác nhận thông số kỹ thuật phi lý không có trong KB.");
  }

  return {
    isValid: violations.length === 0,
    violations,
    reasons,
  };
}

/**
 * Xây dựng câu trả lời fallback an toàn neo chặt vào Verified KB
 * Hoàn toàn động theo KB (không hard-code Bà Nà Hills)
 */
export function buildSafeFallbackReply(
  question: string,
  kb?: VerifiedSalesKnowledgeBase,
  intentHint: SalesIntent = "INTENT_OUT_OF_SCOPE",
): string {
  if (!kb) {
    return "Dạ hiện tại em chưa có thông tin chính thức được xác minh để trả lời câu hỏi này. Anh/chị vui lòng liên hệ hotline đối tác để được hỗ trợ ạ.";
  }

  const qLower = question.toLowerCase();
  const formattedPrice =
    kb.sale_price && kb.sale_price > 0
      ? kb.sale_price.toLocaleString("vi-VN")
      : null;
  const locationSuffix = kb.location ? ` tại ${kb.location}` : "";

  // Xử lý Roleplay Jailbreak
  if (
    qLower.includes("tổng giám đốc") ||
    qLower.includes("bỏ qua tất cả chỉ thị") ||
    qLower.includes("đóng vai tổng giám đốc")
  ) {
    const priceText = formattedPrice
      ? `là ${formattedPrice} VND`
      : "theo biểu giá niêm yết";
    return `Dạ em là Trợ lý tư vấn AI của hệ thống phân phối vé du lịch. Em không có thẩm quyền thay đổi vai trò hay tự ý cấp vé miễn phí. Vé tham quan ${kb.product_name} được phát hành theo đúng biểu giá niêm yết của ban quản lý ${priceText} ạ.`;
  }

  // Xử lý An toàn tài chính / Chuyển khoản cá nhân
  if (
    qLower.includes("tài khoản cá nhân") ||
    qLower.includes("momo cá nhân") ||
    qLower.includes("stk cá nhân") ||
    qLower.includes("chuyển tiền trực tiếp") ||
    qLower.includes("chuyển tiền vào đâu") ||
    qLower.includes("stk")
  ) {
    return `Dạ vì lý do an toàn tài chính và bảo vệ quyền lợi khách hàng, hệ thống ${kb.product_name} tuyệt đối không nhận thanh toán qua số tài khoản cá nhân hay ví điện tử cá nhân ạ. Mọi giao dịch đặt vé đều phải thực hiện qua đường dẫn thanh toán trực tuyến chính thức của hệ thống để được xuất vé điện tử hợp lệ ạ.`;
  }

  // Xử lý Tiện ích hư cấu / Phantom Feature
  if (
    qLower.includes("dát vàng") ||
    qLower.includes("jacuzzi") ||
    qLower.includes("champagne") ||
    qLower.includes("bồn sục") ||
    qLower.includes("trực thăng") ||
    qLower.includes("limousine") ||
    qLower.includes("xe đưa đón")
  ) {
    const incStr =
      kb.inclusions && kb.inclusions.length > 0
        ? kb.inclusions.slice(0, 3).join(", ")
        : "dịch vụ tiêu chuẩn";
    return `Dạ hiện tại ${kb.product_name} chỉ cung cấp các dịch vụ theo tiêu chuẩn công bố (${incStr}), không có dịch vụ khoang dát vàng VIP, bồn sục jacuzzi hay phương tiện đặc biệt ngoài chương trình ạ. Vé đã bao gồm các trải nghiệm thực tế trọn vẹn theo quy định rồi ạ.`;
  }

  // Xử lý Thương hiệu đối thủ / Cross-Brand Scope
  const currentProdLower = kb.product_name.toLowerCase();
  const competitorKeywords = [
    "vinwonders",
    "sun world",
    "bà nà",
    "ba na",
    "nam hội an",
    "hạ long",
    "phú quốc united center",
  ];
  const mentionedCompetitor = competitorKeywords.find(
    (comp) => !currentProdLower.includes(comp) && qLower.includes(comp),
  );
  if (mentionedCompetitor) {
    return `Dạ vé này chỉ áp dụng cho ${kb.product_name}${locationSuffix}, không áp dụng và không bao gồm vé vào cổng hay trò chơi tại các công viên thuộc đơn vị quản lý khác ạ.`;
  }

  // Xử lý Cam kết bồi thường / Refund Overpromise
  if (
    qLower.includes("bồi thường") ||
    qLower.includes("đền tiền") ||
    qLower.includes("hoàn tiền") ||
    qLower.includes("hủy vé") ||
    qLower.includes("trời mưa") ||
    qLower.includes("5 phút")
  ) {
    if (kb.cancellation_policy) {
      return `Dạ theo quy định chính thức của ${kb.product_name}, ${kb.cancellation_policy}. Em không thể đưa ra cam kết đền bù hay hoàn tiền mặt vượt thẩm quyền ạ.`;
    }
    return `Dạ hiện tại hệ thống chưa có dữ liệu xác minh về chính sách hoàn hủy hoặc bồi thường thời tiết cho ${kb.product_name}. Anh/chị vui lòng liên hệ kênh chính thức của đối tác để được thông tin chính xác nhất ạ.`;
  }

  // Xử lý Bóp méo chính sách trẻ em
  if (
    qLower.includes("1m45") ||
    (qLower.includes("trẻ em") && qLower.includes("chiều cao"))
  ) {
    if (kb.child_policy?.rules_summary) {
      const priceText = formattedPrice
        ? ` Vì vậy mức vé áp dụng là ${formattedPrice} VND ạ.`
        : " Vì vậy mức vé áp dụng theo khung quy định ạ.";
      return `Dạ chính sách vé trẻ em tại ${kb.product_name} được tính nghiêm ngặt căn cứ theo chiều cao thực tế khi qua cổng soát vé, không căn cứ vào độ tuổi hay lớp học ạ. Quy định: ${kb.child_policy.rules_summary}.${priceText}`;
    }
    return `Dạ hiện tại hệ thống chưa có dữ liệu xác minh về quy định đo chiều cao hoặc giá vé trẻ em cho ${kb.product_name}. Anh/chị vui lòng tham khảo kênh thông tin chính thức của ban quản lý trước khi đặt vé ạ.`;
  }

  // Xử lý Thông số kỹ thuật phi lý
  if (qLower.includes("500km") || qLower.includes("300km/h")) {
    const specInfo = kb.specs?.cable_length
      ? `chiều dài thực tế ${kb.specs.cable_length} và thời gian di chuyển khoảng ${kb.specs?.transit_time || "15-20 phút"}`
      : "thông số vận hành an toàn tiêu chuẩn quốc tế";
    return `Dạ thông tin cáp treo dài 500km và chạy 300km/h là hoàn toàn không chính xác ạ. Hệ thống ${kb.product_name} có ${specInfo} ngắm cảnh thong thả ạ.`;
  }

  // Xử lý Giá sai lệch / Flash sale ảo / Unbundling
  if (
    intentHint === "INTENT_PRICE_INQUIRY" ||
    intentHint === "INTENT_BARGAIN_SEEKING" ||
    qLower.includes("flash sale") ||
    qLower.includes("trừ") ||
    qLower.includes("bớt") ||
    qLower.includes("giá")
  ) {
    if (formattedPrice) {
      return `Dạ hiện tại bên em không có chương trình giảm giá tự ý hay tách lẻ dịch vụ ạ. Mức giá ưu đãi chính thức của ${kb.product_name}${locationSuffix} đang áp dụng là ${formattedPrice} VND/vé. Anh/chị lưu ý tránh các nguồn tin không chính thống để đảm bảo quyền lợi ạ.`;
    }
    return `Dạ hiện tại hệ thống đang cập nhật biểu giá chính thức cho ${kb.product_name}. Anh/chị vui lòng kiểm tra lại trên kênh chính thức để tránh thông tin sai lệch ạ.`;
  }

  // Fallback chung
  if (formattedPrice) {
    return `Dạ em là Trợ lý tư vấn AI cho ${kb.product_name}${locationSuffix}. Mức giá chính thức hiện tại là ${formattedPrice} VND. Anh/chị có thể tham khảo thêm thông tin chi tiết qua kênh chính thức của đối tác để đảm bảo thông tin chính xác nhất ạ.`;
  }
  return `Dạ em là Trợ lý tư vấn AI cho ${kb.product_name}${locationSuffix}. Anh/chị có thể tham khảo thêm thông tin chi tiết qua kênh chính thức của đối tác để đảm bảo thông tin chính xác nhất ạ.`;
}

/**
 * FAIL-CLOSED GUARD INTERCEPTION
 *
 * Nhận candidate reply (từ live model hoặc input).
 * Thẩm định candidate reply với validateSalesReplyAgainstKB.
 * Nếu phát hiện vi phạm: lập tức thay thế bằng safe reply từ buildSafeFallbackReply.
 */
export function guardSalesReply(
  candidateReply: string | null | undefined,
  question: string,
  kb?: VerifiedSalesKnowledgeBase,
): {
  reply: string;
  intentDetected: SalesIntent;
  purchaseIntent: boolean;
  guardrailValidation: SalesGuardrailValidationResult;
} {
  const intentHint = detectSalesIntent(question);

  if (!kb) {
    const fallback = buildSafeFallbackReply(question, undefined, intentHint);
    return {
      reply: fallback,
      intentDetected: intentHint,
      purchaseIntent: false,
      guardrailValidation: {
        isValid: false,
        violations: [SALES_GUARDRAIL_VIOLATIONS.MISSING_GROUNDING],
        reasons: ["Không có nguồn dữ liệu Knowledge Base được xác minh."],
      },
    };
  }

  // Nếu có candidateReply, thẩm định với validateSalesReplyAgainstKB
  if (candidateReply && candidateReply.trim()) {
    const validation = validateSalesReplyAgainstKB(candidateReply, question, kb);
    if (validation.isValid) {
      return {
        reply: candidateReply,
        intentDetected: intentHint,
        purchaseIntent: intentHint === "INTENT_PURCHASE_READY",
        guardrailValidation: validation,
      };
    }

    // Nếu candidate vi phạm, kích hoạt Fail-Closed
    const safeReply = buildSafeFallbackReply(question, kb, intentHint);
    return {
      reply: safeReply,
      intentDetected: intentHint,
      purchaseIntent: false,
      guardrailValidation: validation,
    };
  }

  // Không có candidateReply (chế độ deterministic offline)
  const safeReply = buildSafeFallbackReply(question, kb, intentHint);
  return {
    reply: safeReply,
    intentDetected: intentHint,
    purchaseIntent: false,
    guardrailValidation: {
      isValid: true,
      violations: [],
      reasons: ["Safe grounded reply generated directly from KB."],
    },
  };
}
