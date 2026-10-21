import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type WorkflowNode = {
  name: string;
  type: string;
  parameters: Record<string, unknown>;
  credentials?: Record<string, { id: string; name: string }>;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  onError?: string;
};

type Workflow = {
  active: boolean;
  nodes: WorkflowNode[];
  connections: Record<
    string,
    Record<string, Array<Array<{ node: string; type: string; index: number }>>>
  >;
};

const workflowPath = new URL(
  "../services/llm-service/workflow_campaign_content.json",
  import.meta.url,
);
const rawWorkflow = readFileSync(workflowPath, "utf8");
const workflow = JSON.parse(rawWorkflow) as Workflow;
const nodes = new Map(workflow.nodes.map((node) => [node.name, node]));
const compose = readFileSync(
  new URL("../docker-compose.n8n.yml", import.meta.url),
  "utf8",
);

test("campaign workflow contains no embedded secrets", () => {
  assert.doesNotMatch(rawWorkflow, /AIza[0-9A-Za-z_-]{20,}/);
  assert.doesNotMatch(rawWorkflow, /(?:api[_-]?key|token|authorization)\s*[=:]\s*["'][^"']{16,}/i);
  for (const node of workflow.nodes) {
    for (const credential of Object.values(node.credentials ?? {})) {
      assert.deepEqual(Object.keys(credential).sort(), ["id", "name"]);
    }
  }
});

test("workflow fans out all personas and keeps the canonical ten/five mapping", () => {
  const expandCode = String(nodes.get("Expand Four Personas")?.parameters.jsCode);
  const mapperCode = String(nodes.get("Map Canonical Ten Rows")?.parameters.jsCode);

  for (const persona of [
    "local_guide",
    "family",
    "foodie",
    "budget_traveler",
  ]) {
    assert.match(expandCode, new RegExp(`${persona}:`));
  }
  assert.match(mapperCode, /hooks\.length !== 10/);
  assert.match(mapperCode, /scripts\.length !== 5/);
  assert.match(mapperCode, /data\.scripts\[index\] \?\? null/);
  assert.match(mapperCode, /data\.captions\[index\] \?\? null/);
  assert.match(mapperCode, /data\.ctas\[index\] \?\? null/);
  assert.doesNotMatch(mapperCode, /index\s*%\s*5/);
});

test("native structured parser is wired without an extra fixer-model call", () => {
  assert.equal(
    nodes.get("Generate Structured Content")?.parameters.hasOutputParser,
    true,
  );
  assert.deepEqual(
    workflow.connections["Validate Content Schema"]?.ai_outputParser?.[0]?.[0],
    {
      node: "Generate Structured Content",
      type: "ai_outputParser",
      index: 0,
    },
  );
  assert.equal(nodes.get("Validate Content Schema")?.parameters.autoFix, false);
  assert.equal(nodes.has("Gemini Schema Fixer"), false);

  const parserSchema = JSON.parse(
    String(nodes.get("Validate Content Schema")?.parameters.inputSchema),
  ) as {
    required: string[];
    properties: Record<string, unknown>;
  };
  assert.deepEqual(parserSchema.required.sort(), [
    "captions",
    "ctas",
    "hooks",
    "persona",
    "scripts",
  ]);
});

test("personas are serialized with a cooldown and a valid loop feedback edge", () => {
  assert.equal(nodes.get("Loop Over Personas")?.type, "n8n-nodes-base.splitInBatches");
  assert.equal(nodes.get("Loop Over Personas")?.parameters.batchSize, 1);
  assert.deepEqual(nodes.get("Loop Over Personas")?.parameters.options, {
    reset: false,
  });
  assert.equal(nodes.get("Wait Between Gemini Calls")?.type, "n8n-nodes-base.wait");
  assert.equal(nodes.get("Wait Between Gemini Calls")?.parameters.amount, 15);
  assert.equal(nodes.get("Wait Between Gemini Calls")?.parameters.unit, "seconds");

  assert.equal(
    workflow.connections["Loop Over Personas"]?.main?.[0]?.[0]?.node,
    "Collect Persona Results",
    "output 0 must be the done branch",
  );
  assert.equal(
    workflow.connections["Loop Over Personas"]?.main?.[1]?.[0]?.node,
    "Generate Structured Content",
    "output 1 must be the loop branch",
  );
  assert.equal(
    workflow.connections["Wait Between Gemini Calls"]?.main?.[0]?.[0]?.node,
    "Loop Over Personas",
    "the cooldown must feed back into the loop",
  );
});

test("HTTP calls retry conservatively while Gemini never multiplies calls", () => {
  const retryNodes = [
    "Enrich Verified Campaign",
    "Persist Guarded Content Batch",
  ];
  for (const name of retryNodes) {
    const node = nodes.get(name);
    assert.equal(node?.retryOnFail, true, `${name} must retry`);
    assert.equal(node?.maxTries, 3, `${name} must use three tries`);
    assert.equal(node?.waitBetweenTries, 5000, `${name} retry delay`);
  }
  assert.notEqual(nodes.get("Generate Structured Content")?.retryOnFail, true);
  assert.equal(nodes.get("Generate Structured Content")?.maxTries, undefined);
});

test("every fallible main-path node has a wired error output", () => {
  for (const name of [
    "Enrich Verified Campaign",
    "Expand Four Personas",
    "Generate Structured Content",
    "Map Canonical Ten Rows",
    "Persist Guarded Content Batch",
  ]) {
    assert.equal(nodes.get(name)?.onError, "continueErrorOutput");
    assert.equal(
      workflow.connections[name]?.main?.[1]?.[0]?.node,
      "Respond Sanitized Error",
      `${name} must wire main[1]`,
    );
  }
});

test("rate-limit failures return a sanitized retryable 503", () => {
  const errorNode = nodes.get("Respond Sanitized Error");
  assert.match(String(errorNode?.parameters.responseBody), /upstream_rate_limited/);
  assert.match(String(errorNode?.parameters.responseBody), /retry_after_seconds/);
  assert.match(
    String((errorNode?.parameters.options as { responseCode?: unknown })?.responseCode),
    /503\s*:\s*502/,
  );
  assert.doesNotMatch(String(errorNode?.parameters.responseBody), /detail\s*:/);
});

test("repository export remains inactive until an approved live smoke test", () => {
  assert.equal(workflow.active, false);
  assert.equal(nodes.get("Rate Limit Safety Note")?.type, "n8n-nodes-base.stickyNote");
  assert.match(
    String(nodes.get("Rate Limit Safety Note")?.parameters.content),
    /N8N_CONCURRENCY_PRODUCTION_LIMIT=1/,
  );
});

test("self-hosted n8n queues overlapping production executions", () => {
  assert.match(compose, /N8N_CONCURRENCY_PRODUCTION_LIMIT:\s*["']?1["']?/);
  assert.match(compose, /docker\.n8n\.io\/n8nio\/n8n:2\.43\.7/);
});

test("webhook uses an explicit response node and both APIs use credentials", () => {
  assert.equal(
    nodes.get("Campaign Created Webhook")?.parameters.responseMode,
    "responseNode",
  );
  assert.equal(
    nodes.get("Enrich Verified Campaign")?.credentials?.httpHeaderAuth.id,
    "be2RagHeaderAuth",
  );
  assert.equal(
    nodes.get("Persist Guarded Content Batch")?.credentials?.httpHeaderAuth.id,
    "be2ContentsHeaderAuth",
  );
  assert.equal(
    nodes.get("Gemini Content Model")?.credentials?.googlePalmApi.id,
    "be2GeminiCredential",
  );
});
