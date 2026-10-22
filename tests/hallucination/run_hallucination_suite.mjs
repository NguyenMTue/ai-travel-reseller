import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ADVERSARIAL_TEST_CASES,
  generateStubSalesReply,
  VERIFIED_KNOWLEDGE_BASE,
} from "./test_sales_agent_hallucination.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTestSuite() {
  const isLive =
    Boolean(process.env.GEMINI_API_KEY?.trim()) &&
    process.env.BE2_HALLUCINATION_LIVE === "1";
  const executionMode = isLive
    ? "LIVE_GEMINI_API"
    : "OFFLINE_STUB_MOCK (Thời điểm B - Offline deterministic)";
  const timestamp = new Date().toISOString();

  console.log(`\n======================================================================`);
  console.log(`  BỘ TEST SUITE TẤN CÔNG CHỐNG HALLUCINATION - AI SALES AGENT`);
  console.log(`  Thời gian: ${timestamp}`);
  console.log(`  Chế độ: ${executionMode}`);
  console.log(`  Số lượng test cases: ${ADVERSARIAL_TEST_CASES.length}`);
  console.log(`======================================================================\n`);

  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  let logBuffer = "";
  logBuffer += `========================================================================================\n`;
  logBuffer += `            KẾT QUẢ KIỂM THỬ ADVERSARIAL CHỐNG HALLUCINATION AI SALES AGENT             \n`;
  logBuffer += `========================================================================================\n`;
  logBuffer += `Thời gian thực thi   : ${timestamp}\n`;
  logBuffer += `Chế độ chạy          : ${executionMode}\n`;
  logBuffer += `API Key Status       : ${Boolean(process.env.GEMINI_API_KEY?.trim()) ? "Configured" : "MISSING"}\n`;
  logBuffer += `Live Flag (BE2_HALLUCINATION_LIVE) : ${process.env.BE2_HALLUCINATION_LIVE === "1" ? "1 (Active)" : "0/Unset (Offline Default)"}\n`;
  logBuffer += `Môi trường cô lập    : STRICT ISOLATION (Chỉ chạy và ghi log bên trong tests/)\n`;
  logBuffer += `Tổng số test case    : ${ADVERSARIAL_TEST_CASES.length}\n`;
  logBuffer += `----------------------------------------------------------------------------------------\n\n`;

  for (let i = 0; i < ADVERSARIAL_TEST_CASES.length; i++) {
    const tc = ADVERSARIAL_TEST_CASES[i];
    const startTime = performance.now();
    let reply = "";
    let intentDetected = "";
    let purchaseIntent = false;

    if (isLive) {
      try {
        const { generateSalesReply } = await import("../../src/lib/ai/sales-agent.ts");
        const formattedContext = JSON.stringify(VERIFIED_KNOWLEDGE_BASE);
        const res = await generateSalesReply({
          question: tc.attackPrompt,
          history: [],
          context: formattedContext,
          checkoutAvailable: false,
        });
        reply = res.reply;
        intentDetected = res.intentDetected;
        purchaseIntent = res.purchaseIntent;
      } catch (err) {
        reply = `ERROR_INVOKING_MODEL: ${err.message}`;
      }
    } else {
      const res = generateStubSalesReply(tc.attackPrompt);
      reply = res.reply;
      intentDetected = res.intentDetected;
      purchaseIntent = res.purchaseIntent;
    }

    const elapsedMs = (performance.now() - startTime).toFixed(2);

    // Validate forbidden patterns
    let patternFailed = false;
    let patternFailReason = "";
    for (const pat of tc.forbiddenPatterns) {
      if (pat.test(reply)) {
        patternFailed = true;
        patternFailReason = `Vi phạm mẫu cấm hallucination: ${pat}`;
        break;
      }
    }

    const validation = tc.validateResponse(reply, intentDetected);
    const passed = !patternFailed && validation.passed;

    if (passed) {
      passedCount++;
    } else {
      failedCount++;
    }

    const testCaseResult = {
      index: i + 1,
      id: tc.id,
      name: tc.name,
      category: tc.category,
      attackVector: tc.attackVector,
      hallucinationRisk: tc.hallucinationRisk,
      attackPrompt: tc.attackPrompt,
      expectedBehavior: tc.expectedBehavior,
      actualReply: reply,
      intentDetected,
      purchaseIntent,
      elapsedMs: Number(elapsedMs),
      status: passed ? "PASS" : "FAIL",
      evaluationReason: patternFailed ? patternFailReason : validation.reason,
    };

    results.push(testCaseResult);

    // Append to log buffer
    logBuffer += `[TEST CASE ${String(i + 1).padStart(2, "0")}] ${tc.id}: ${tc.name}\n`;
    logBuffer += `  Phân loại rủi ro   : ${tc.category}\n`;
    logBuffer += `  Vector tấn công    : ${tc.attackVector}\n`;
    logBuffer += `  Nguy cơ tiềm ẩn    : ${tc.hallucinationRisk}\n`;
    logBuffer += `  Input Adversarial  : "${tc.attackPrompt}"\n`;
    logBuffer += `  Hành vi kỳ vọng    : ${tc.expectedBehavior}\n`;
    logBuffer += `  Intent nhận diện   : ${intentDetected}\n`;
    logBuffer += `  Phản hồi thực tế   : "${reply}"\n`;
    logBuffer += `  Đánh giá kết quả   : ${passed ? "[PASS] ĐẠT" : "[FAIL] KHÔNG ĐẠT"} - ${testCaseResult.evaluationReason}\n`;
    logBuffer += `  Thời gian xử lý    : ${elapsedMs} ms\n`;
    logBuffer += `----------------------------------------------------------------------------------------\n\n`;

    console.log(
      `[${passed ? "PASS" : "FAIL"}] ${tc.id} (${elapsedMs}ms): ${tc.name} -> ${testCaseResult.evaluationReason}`,
    );
  }

  const passRate = ((passedCount / ADVERSARIAL_TEST_CASES.length) * 100).toFixed(1);

  logBuffer += `========================================================================================\n`;
  logBuffer += `                                TỔNG KẾT TEST SUITE                                     \n`;
  logBuffer += `========================================================================================\n`;
  logBuffer += `Tổng số test case     : ${ADVERSARIAL_TEST_CASES.length}\n`;
  logBuffer += `Thành công (PASS)     : ${passedCount}\n`;
  logBuffer += `Thất bại (FAIL)       : ${failedCount}\n`;
  logBuffer += `Tỷ lệ phòng thủ       : ${passRate}%\n`;
  logBuffer += `Trạng thái bộ test    : ${failedCount === 0 ? "HOÀN THÀNH - TẤT CẢ TEST CASES ĐẠT CHUẨN" : "CẦN TINH CHỈNH PROMPT/GUARDRAILS"}\n`;
  logBuffer += `========================================================================================\n`;

  // Write log file
  const logPath = path.join(__dirname, "results_hallucination_test.log");
  const jsonPath = path.join(__dirname, "results_hallucination_test.json");

  await fs.writeFile(logPath, logBuffer, "utf-8");
  await fs.writeFile(
    jsonPath,
    JSON.stringify(
      {
        testSuite: "AI Sales Agent Anti-Hallucination Adversarial Suite",
        timestamp,
        executionMode,
        isLive,
        totalCases: ADVERSARIAL_TEST_CASES.length,
        passed: passedCount,
        failed: failedCount,
        passRate: `${passRate}%`,
        results,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(`\nĐã ghi nhận kết quả test suite ra file:`);
  console.log(`  - File LOG  : ${logPath}`);
  console.log(`  - File JSON : ${jsonPath}`);
  console.log(`\nKết quả tổng thể: ${passedCount}/${ADVERSARIAL_TEST_CASES.length} PASS (${passRate}%)`);
}

runTestSuite().catch((err) => {
  console.error("Test suite runner error:", err);
  process.exit(1);
});
