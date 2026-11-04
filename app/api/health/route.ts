import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = performance.now();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "https://ykfosnwbgphlwpufnxrd.supabase.co";
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  let dbStatus = "unknown";
  let dbLatencyMs = -1;
  let dbError: string | null = null;
  let storageStatus = "unknown";

  if (supabaseUrl && supabaseKey) {
    try {
      const client = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      // 1. Check DB connectivity & latency
      const dbStart = performance.now();
      const { error } = await client
        .from("products")
        .select("id")
        .limit(1);
      dbLatencyMs = Math.round((performance.now() - dbStart) * 100) / 100;

      if (error) {
        dbStatus = "error";
        dbError = error.message;
      } else {
        dbStatus = "up";
      }

      // 2. Check campaign-videos storage bucket
      const { error: storageErr } = await client.storage
        .from("campaign-videos")
        .list("", { limit: 1 });
      storageStatus = storageErr ? "degraded" : "up";
    } catch (err: unknown) {
      dbStatus = "unreachable";
      dbError = err instanceof Error ? err.message : String(err);
      storageStatus = "unreachable";
    }
  } else {
    dbStatus = "unconfigured";
    dbError = "Missing Supabase configuration";
  }

  const isHealthy = dbStatus === "up";
  const totalDurationMs = Math.round((performance.now() - startTime) * 100) / 100;

  const responseBody = {
    status: isHealthy ? "healthy" : "degraded",
    service: "TravelLink AI Production API",
    version: "1.0.0-mvp",
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
    duration_ms: totalDurationMs,
    checks: {
      database: {
        status: dbStatus,
        latency_ms: dbLatencyMs,
        endpoint: supabaseUrl.replace(/https?:\/\//, "").split("/")[0],
        error: dbError,
      },
      storage: {
        bucket: "campaign-videos",
        status: storageStatus,
      },
      pooler: {
        mode: "transaction",
        port: 6543,
        status: "active",
      },
    },
  };

  return Response.json(responseBody, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Health-Status": isHealthy ? "healthy" : "degraded",
    },
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Health-Status": "healthy",
      "X-Service-Version": "1.0.0-mvp",
    },
  });
}
