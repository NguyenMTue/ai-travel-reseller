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
