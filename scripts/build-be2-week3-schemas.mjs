import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  campaignContentJsonSchema,
} from "../src/lib/ai/schemas/content-schema.ts";
import {
  campaignVideoScriptJsonSchema,
  videoAnalysisJsonSchema,
} from "../src/lib/ai/schemas/video-schema.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(root, "docs/be2");

mkdirSync(outputDirectory, { recursive: true });

for (const [filename, schema] of [
  ["content-factory.schema.json", campaignContentJsonSchema],
  ["video-analysis.schema.json", videoAnalysisJsonSchema],
  ["video-script.schema.json", campaignVideoScriptJsonSchema],
]) {
  writeFileSync(
    resolve(outputDirectory, filename),
    `${JSON.stringify(schema, null, 2)}\n`,
    "utf8",
  );
}
