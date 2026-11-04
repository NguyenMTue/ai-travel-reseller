#!/usr/bin/env node
/**
 * UAT CHAT AUDIT & REAL-TIME MONITORING SCRIPT (BE2 - Week 5)
 *
 * Giám sát trực tiếp phiên kiểm thử UAT giữa người dùng thật và AI Sales Agent:
 * - Phân tích log luồng trò chuyện
 * - Phân loại 6 nhóm Intent Taxonomy
 * - Cảnh báo tức thời nếu guardrail phát hiện rủi ro hoặc API gặp sự cố
 * - Thống kê KPI: Độ trễ (TTFT/Total), Tỷ lệ Intent Purchase, Tỷ lệ an toàn
 */

import readline from "node:readline";

const INTENT_COLORS = {
  INTENT_PURCHASE_READY: "\x1b[32m", // Green
  INTENT_PRICE_INQUIRY: "\x1b[36m",  // Cyan
  INTENT_POLICY_INQUIRY: "\x1b[34m", // Blue
  INTENT_FACILITY_INQUIRY: "\x1b[35m",// Magenta
  INTENT_BARGAIN_SEEKING: "\x1b[33m",// Yellow
  INTENT_OUT_OF_SCOPE: "\x1b[90m",   // Gray
};

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";

const stats = {
  total: 0,
  intents: {},
  errors: 0,
  checkoutUrlsGenerated: 0,
  totalLatencyMs: 0,
};

function printBanner() {
  console.log(`
${BOLD}================================================================${RESET}
${BOLD}🎯 TRAVELINK AI — REAL-TIME SALES AGENT UAT MONITORING DASHBOARD${RESET}
${BOLD}================================================================${RESET}
Trạng thái: ${GREEN}LIVE LISTENING${RESET} | Model: ${BOLD}gemini-3.5-flash-lite${RESET}
Nhấn Ctrl+C để kết thúc phiên giám sát và xuất báo cáo tổng hợp.
----------------------------------------------------------------
`);
}

export function processLogLine(line) {
  try {
    const trimmed = line.trim();
    if (!trimmed.includes("AI_SALES_CHAT_AUDIT") && !trimmed.includes("AI_SALES_CHAT_ERROR")) {
      return null;
    }

    const jsonMatch = trimmed.match(/\{.*\}$/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);

    if (data.tag === "AI_SALES_CHAT_AUDIT") {
      stats.total++;
      stats.intents[data.intent_detected] = (stats.intents[data.intent_detected] || 0) + 1;
      stats.totalLatencyMs += data.duration_ms;
      if (data.has_checkout_url) stats.checkoutUrlsGenerated++;

      const color = INTENT_COLORS[data.intent_detected] || RESET;
      const statusIcon = data.has_checkout_url ? "🛒 [CONVERSION]" : "💬";

      console.log(
        `[${data.timestamp.slice(11, 19)}] ${statusIcon} ` +
        `Intent: ${color}${BOLD}${data.intent_detected}${RESET} | ` +
        `Latency: ${data.duration_ms}ms | ` +
        `Len: Q:${data.question_length}c / R:${data.reply_length}c | ` +
        `Ref: ${data.reseller_id.slice(0, 8)}...`
      );
      return data;
    }

    if (data.tag === "AI_SALES_CHAT_ERROR") {
      stats.errors++;
      console.log(
        `[${data.timestamp.slice(11, 19)}] ${RED}❌ [ERROR]${RESET} ` +
        `Reason: ${data.error} | Latency: ${data.duration_ms}ms`
      );
      return data;
    }
  } catch {
    // Ignore non-json or unparseable log lines
  }
  return null;
}

function printSummary() {
  console.log(`\n${BOLD}================ TỔNG KẾT PHIÊN GIÁM SÁT UAT ================${RESET}`);
  console.log(`Tổng số lượt chat: ${BOLD}${stats.total}${RESET}`);
  console.log(`Số phiên lỗi / failover: ${stats.errors > 0 ? RED : GREEN}${stats.errors}${RESET}`);
  console.log(
    `Độ trễ trung bình: ${BOLD}${stats.total > 0 ? Math.round(stats.totalLatencyMs / stats.total) : 0}ms${RESET}`
  );
  console.log(`Số liên kết chốt đơn (Checkout URLs): ${GREEN}${BOLD}${stats.checkoutUrlsGenerated}${RESET}`);
  console.log(`Phân bổ Intent:`);
  for (const [intent, count] of Object.entries(stats.intents)) {
    const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : "0";
    console.log(`  - ${intent}: ${count} (${pct}%)`);
  }
  console.log(`${BOLD}================================================================${RESET}\n`);
}

// Running as CLI
if (process.argv[1]?.endsWith("monitor-uat-chat-logs.mjs")) {
  printBanner();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", (line) => {
    processLogLine(line);
  });

  process.on("SIGINT", () => {
    printSummary();
    process.exit(0);
  });
}

