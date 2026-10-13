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

The output contract has 10 hooks and 5 scripts/captions/CTAs, while each
`contents` row has one column for each asset. BE2, BE3 and FE must agree on the
row mapping before the n8n batch insert is finalized.
