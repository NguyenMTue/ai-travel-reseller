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

## Live n8n E2E and hardening acceptance — 2026-10-21

| Check | Result |
|---|---|
| Deterministic BE2 suite (`test:be2`) | 43/43 PASS |
| Deterministic Tester2 suite (`test:tester2`) | 17/17 PASS |
| Python Content API suite (`test_rag_api_contents`) | 10/10 PASS |
| Python Guardrails suite (`test_content_guardrails`) | 13/13 PASS |
| Bà Nà Hills Live n8n E2E execution | 4/4 personas PASS (40 canonical rows `approved`) |
| VinWonders Live n8n E2E execution | 4/4 personas PASS (40 canonical rows `approved`) |
| Idempotency re-run test | 0 new rows inserted (`inserted_count: 0`), existing IDs preserved |
| Structured Output Parser | 8/8 executions clean JSON schema validation |
| n8n production readiness checklist | 9/9 PASS, `active: false`, no embedded credentials |

### Detailed Live Matrix

| Product | Persona | Total Rows | Full / Hook-only | Guardrail Status | Persisted in Local Supabase |
|---|---|---|---|---|---|
| Bà Nà Hills | `local_guide` | 10 | 5 full + 5 hook-only | `approved` | Yes (10 canonical rows) |
| Bà Nà Hills | `family` | 10 | 5 full + 5 hook-only | `approved` | Yes (10 canonical rows) |
| Bà Nà Hills | `foodie` | 10 | 5 full + 5 hook-only | `approved` | Yes (10 canonical rows) |
| Bà Nà Hills | `budget_traveler` | 10 | 5 full + 5 hook-only | `approved` | Yes (10 canonical rows) |
| VinWonders Nam Hội An | `local_guide` | 10 | 5 full + 5 hook-only | `approved` | Yes (10 canonical rows) |
| VinWonders Nam Hội An | `family` | 10 | 5 full + 5 hook-only | `approved` | Yes (10 canonical rows) |
| VinWonders Nam Hội An | `foodie` | 10 | 5 full + 5 hook-only | `approved` | Yes (10 canonical rows) |
| VinWonders Nam Hội An | `budget_traveler` | 10 | 5 full + 5 hook-only | `approved` | Yes (10 canonical rows) |

### Hardening and Bug Fixes Applied

1. **Persistence & Idempotency Fix (`POST /contents/batch`):**
   - Replaced `ignore_duplicates=True` with `ignore_duplicates=False` on Postgres upsert.
   - Accurately tracks `inserted_count`, `updated_count`, and `persisted_count`.
   - Guaranteed that updated statuses from re-runs (e.g. from `needs_review` to `approved`) are properly written to database and match the API response.
2. **Persona Claim Grounding:**
   - Root-caused `PROHIBITED_CLAIM` triggers: "vô vàn" (foodie/local_guide), "không gian rộng lớn" (local_guide), and unverified duration / price assurances (budget_traveler).
   - Hardened prompts without weakening guardrails.
   - All 4 personas for both products now successfully pass guardrails as `approved`.
3. **Structured Output Parser Compliance:**
   - Resolved JSON markdown fence end line formatting bug and regex compatibility in Zod schemas.
   - Enforced root 5-key object output contract without wrapper keys.
