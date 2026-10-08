import { GoogleGenAI } from "@google/genai";

export const EMBEDDING_MODEL = "gemini-embedding-2";
export const EMBEDDING_DIMENSIONS = 1536;

function requireText(text: string, label: string): string {
  const input = text.trim();

  if (!input) {
    throw new Error(`${label} cannot be empty`);
  }

  return input;
}

export function formatEmbeddingDocument(title: string, content: string): string {
  return `title: ${requireText(title, "Document title")} | text: ${requireText(content, "Document content")}`;
}

export function formatEmbeddingQuery(query: string): string {
  return `task: search result | query: ${requireText(query, "Search query")}`;
}

export async function generateEmbedding(
  text: string
): Promise<number[]> {
  const input = requireText(text, "Embedding input");

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: input,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Gemini returned an invalid embedding dimension; expected ${EMBEDDING_DIMENSIONS}`,
    );
  }

  if (embedding.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding contains a non-finite value");
  }

  return embedding;
}
