# BE2 Content Factory Test Report

**Date:** 2026-10-13
**Model:** `gemini-3.5-flash-lite`
**Product fixture:** Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế

## Results

| Check | Result |
|---|---|
| Deterministic unit tests | 11/11 PASS |
| Live Gemini generations parsed by Zod | 10/10 PASS |
| Persona coverage | local_guide, family, foodie, budget_traveler |
| Guardrail status for live outputs | 10/10 APPROVED |
| Synthetic violation cases | 5/5 detected |
| TypeScript | PASS |
| Targeted ESLint | PASS |

## Incremental verification — 2026-10-15

| Check | Result |
|---|---|
| Deterministic unit tests | 14/14 PASS |
| Persistence mapping | 10 rows: 5 complete + 5 hook-only PASS |
| Database status normalization | `APPROVED` → `approved`; `NEEDS_REVIEW` → `needs_review` PASS |
| Live Bà Nà Hills generations | local_guide + foodie PASS |
| Live VinWonders generations | family + budget_traveler PASS |
| Live schema parse and guardrails | 4/4 PASS |
| TypeScript | PASS |
| Targeted ESLint | PASS |

The 15/10 live run remained read-only: it called Gemini and validated results in
memory, but did not write Supabase or invoke n8n. Full BE2-W2-05 acceptance still
depends on BE3's workflow writing the mapped rows to `contents`.

The live test did not write to Supabase. It validated responses in memory and
printed only run number, persona and PASS status; API keys and generated content
were not logged.

## Commands

```powershell
npm.cmd run test:be2
$env:BE2_LIVE_RUNS='10'; npm.cmd run test:be2:live
npx.cmd tsc --noEmit
npx.cmd eslint src/lib/ai/prompts src/lib/ai/schemas src/lib/ai/guardrails tests/content-factory.test.ts tests/content-factory.live.ts
```

## Open interface decision

BE2 now provides a tested reference mapper for the unequal arrays: five complete
rows plus five hook-only rows, without cycling or duplicating assets. It also
normalizes guardrail statuses to lowercase database values so FE can display
`approved` rows. BE3 and FE acceptance is still required during the first live
workflow test.

## Integration-ready verification — 2026-10-16

| Check | Result |
|---|---|
| Deterministic BE2 suite | 17/17 PASS |
| Common n8n parser violations | Script strings, missing hashtags, missing CTA token and extra keys rejected |
| `/contents/batch` payload mapper | Four personas; 10 records each; 5 complete + 5 hook-only; no asset cycling PASS |
| BE3 Python API tests | 8/8 PASS with mocked Supabase |
| FE approved-content contract | 14/14 PASS |
| Production build | PASS — 23 routes generated |
| TypeScript and targeted ESLint | PASS |

The new `src/lib/ai/content-batch.ts` mapper creates the exact request body for
BE3's `POST /contents/batch` endpoint while preserving the BE2 10/5 contract.
It deliberately excludes server-owned fields such as `status`, `product_id`,
`reseller_id`, and `generation_key`.

The BE3 tests were independently re-run in an isolated temporary Python
environment. They prove request validation, guardrail behavior, script
formatting and idempotent behavior against a fake Supabase client. The FE tests
prove that only exact lowercase `approved` rows in the correct campaign and
shared/owned scope are read. These are integration-ready checks, not evidence
of a live n8n → Supabase execution.

## Guardrail hardening and live review — 2026-10-16

| Check | Result |
|---|---|
| Deterministic BE2 suite | 19/19 PASS |
| Deterministic Tester2 suite | 17/17 PASS |
| BE3 Python API/guardrail suite | 9/9 PASS in an isolated environment |
| Direct Gemini persona/product matrix | 8/8 schema-valid; 5 APPROVED; 3 NEEDS_REVIEW |
| Direct adversarial prompt-injection run | 1/1 PASS |
| TypeScript and targeted ESLint | PASS |

The direct Gemini matrix now covers both products against all four personas.
Three outputs were correctly retained for human review because they contained
unsupported offer or descriptive claims. The adversarial sample did not follow
the injected instruction, did not add an undeclared field, and did not invent
the requested voucher or price.

These results are direct-model and local-service evidence only. Final acceptance
still requires BE3 to provide the exported n8n workflow and an execution showing
the Supabase trigger, Gemini structured output, guardrail result, and database
write in one trace.
