import { NextResponse } from "next/server";
import { z } from "zod";

import {
  answerProductChat,
  InvalidAttributionError,
} from "@/src/lib/ai/chat";

export const runtime = "nodejs";

const POSTGRES_UUID_PATTERN =
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2_000),
});

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  conversation_history: z
    .array(conversationMessageSchema)
    .max(12)
    .default([]),
  attribution_context: z.object({
    reseller_id: z.string().trim().regex(POSTGRES_UUID_PATTERN),
    campaign_id: z.string().trim().regex(POSTGRES_UUID_PATTERN),
    product_id: z.string().trim().regex(POSTGRES_UUID_PATTERN),
  }),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid chat request",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const startTime = Date.now();

  try {
    const answer = await answerProductChat({
      message: parsed.data.message,
      conversationHistory: parsed.data.conversation_history,
      attribution: parsed.data.attribution_context,
    });

    const durationMs = Date.now() - startTime;

    console.info(
      JSON.stringify({
        tag: "AI_SALES_CHAT_AUDIT",
        timestamp: new Date().toISOString(),
        reseller_id: parsed.data.attribution_context.reseller_id,
        campaign_id: parsed.data.attribution_context.campaign_id,
        product_id: parsed.data.attribution_context.product_id,
        question_length: parsed.data.message.length,
        intent_detected: answer.intent_detected,
        has_checkout_url: Boolean(answer.suggested_checkout_url),
        reply_length: answer.reply.length,
        duration_ms: durationMs,
      }),
    );

    return NextResponse.json(answer);
  } catch (error) {
    const durationMs = Date.now() - startTime;

    console.error(
      JSON.stringify({
        tag: "AI_SALES_CHAT_ERROR",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        duration_ms: durationMs,
      }),
    );

    if (error instanceof InvalidAttributionError) {
      return NextResponse.json(
        { error: "Attribution context was not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Unable to answer this message right now" },
      { status: 500 },
    );
  }
}
