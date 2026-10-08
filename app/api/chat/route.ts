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

  try {
    const answer = await answerProductChat({
      message: parsed.data.message,
      conversationHistory: parsed.data.conversation_history,
      attribution: parsed.data.attribution_context,
    });

    return NextResponse.json(answer);
  } catch (error) {
    if (error instanceof InvalidAttributionError) {
      return NextResponse.json(
        { error: "Attribution context was not found" },
        { status: 404 },
      );
    }

    console.error("Sales agent chat error:", error);
    return NextResponse.json(
      { error: "Unable to answer this message right now" },
      { status: 500 },
    );
  }
}
