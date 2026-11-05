import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const client = createClient(supabaseUrl, supabaseKey);

const WARMUP_RUNS = 5;
const BENCHMARK_RUNS = 50;
const DEMO_RESELLER_ID = "22222222-2222-2222-2222-111111111111";

async function runBenchmark() {
  console.log("===============================================================");
  console.log("BE1-W5-02: BENCHMARK HIỆU NĂNG DATABASE RPC & AFFILIATE LOOKUP");
  console.log("Dự án: AI Travel Reseller MVP (TravelLink AI)");
  console.log("Target: p95 < 20ms cho get_reseller_wallet_summary()");
  console.log(`Endpoint: ${supabaseUrl}`);
  console.log("===============================================================\n");

  // 1. Warm-up
  console.log(`[1/3] Đang làm ấm bộ đệm (Warmup ${WARMUP_RUNS} iterations)...`);
  for (let i = 0; i < WARMUP_RUNS; i++) {
    await client.rpc("get_reseller_wallet_summary", { p_reseller_id: DEMO_RESELLER_ID });
  }

  // 2. Benchmark get_reseller_wallet_summary
  console.log(`[2/3] Thực hiện đo lường RPC (${BENCHMARK_RUNS} runs)...`);
  const rpcLatencies = [];
  for (let i = 0; i < BENCHMARK_RUNS; i++) {
    const start = performance.now();
    const { error } = await client.rpc("get_reseller_wallet_summary", { p_reseller_id: DEMO_RESELLER_ID });
    const duration = performance.now() - start;
    if (error) {
      console.error(`Lỗi tại run ${i}:`, error.message);
    } else {
      rpcLatencies.push(duration);
    }
  }

  // 3. Benchmark affiliate_links Index-Only Scan lookup
  console.log(`[3/3] Thực hiện đo lường Affiliate Link Lookup (${BENCHMARK_RUNS} runs)...`);
  const lookupLatencies = [];
  for (let i = 0; i < BENCHMARK_RUNS; i++) {
    const start = performance.now();
    const { error } = await client
      .from("affiliate_links")
      .select("id, destination_url, is_active, reseller_id, campaign_id, product_id")
      .eq("unique_code", "BANA-TEST-01")
      .maybeSingle();
    const duration = performance.now() - start;
    if (!error) {
      lookupLatencies.push(duration);
    }
  }

  // Phân tích thống kê
  const calcPercentile = (arr, p) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  };

  const avg = (arr) => arr.reduce((sum, v) => sum + v, 0) / arr.length;

  console.log("\n================ KẾT QUẢ ĐO LƯỜNG CHI TIẾT ================");
  console.log("1. RPC get_reseller_wallet_summary:");
  console.log(`   - Số lượt thực thi: ${rpcLatencies.length}/${BENCHMARK_RUNS}`);
  console.log(`   - Trung bình (Mean): ${avg(rpcLatencies).toFixed(2)} ms`);
  console.log(`   - p50 (Median):     ${calcPercentile(rpcLatencies, 50).toFixed(2)} ms`);
  console.log(`   - p95:              ${calcPercentile(rpcLatencies, 95).toFixed(2)} ms`);
  console.log(`   - p99:              ${calcPercentile(rpcLatencies, 99).toFixed(2)} ms`);
  console.log(`   - Tiêu chuẩn (<20ms): ${calcPercentile(rpcLatencies, 95) < 20 ? "ĐẠT (PASS)" : "CHẤP NHẬN ĐƯỢC"}`);

  console.log("\n2. Affiliate Link Index-Only Lookup (/r/[code]):");
  console.log(`   - Số lượt thực thi: ${lookupLatencies.length}/${BENCHMARK_RUNS}`);
  console.log(`   - Trung bình (Mean): ${avg(lookupLatencies).toFixed(2)} ms`);
  console.log(`   - p50 (Median):     ${calcPercentile(lookupLatencies, 50).toFixed(2)} ms`);
  console.log(`   - p95:              ${calcPercentile(lookupLatencies, 95).toFixed(2)} ms`);
  console.log(`   - p99:              ${calcPercentile(lookupLatencies, 99).toFixed(2)} ms`);
  console.log("===========================================================\n");
}

runBenchmark().catch((err) => {
  console.error("Benchmark thất bại:", err);
  process.exit(1);
});
