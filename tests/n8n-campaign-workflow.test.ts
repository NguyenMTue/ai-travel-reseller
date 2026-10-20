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

test("native structured parser and auto-fix model are wired to the chain", () => {
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
  assert.deepEqual(
    workflow.connections["Gemini Schema Fixer"]?.ai_languageModel?.[0]?.[0],
    {
      node: "Validate Content Schema",
      type: "ai_languageModel",
      index: 0,
    },
  );

  const parserSchema = JSON.parse(
    String(nodes.get("Validate Content Schema")?.parameters.inputSchema),
  ) as {
    required: string[];
    properties: { output: { required: string[] } };
  };
  assert.deepEqual(parserSchema.required, ["output"]);
  assert.deepEqual(parserSchema.properties.output.required.sort(), [
    "captions",
    "ctas",
    "hooks",
    "persona",
    "scripts",
  ]);
});

test("every fallible main-path node retries or has a wired error output", () => {
  const retryNodes = [
    "Enrich Verified Campaign",
    "Generate Structured Content",
    "Persist Guarded Content Batch",
  ];
  for (const name of retryNodes) {
    const node = nodes.get(name);
    assert.equal(node?.retryOnFail, true, `${name} must retry`);
    assert.equal(node?.maxTries, 5, `${name} must use five tries`);
    assert.equal(node?.waitBetweenTries, 5000, `${name} retry delay`);
  }

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
