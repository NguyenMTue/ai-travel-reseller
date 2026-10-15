# BE2 Content Factory Handoff

## Ownership boundary

- BE2 owns the persona prompts, structured-output contract and deterministic guardrails.
- BE3 owns the n8n workflow, credentials, retry policy and Supabase writes.
- This handoff does not add or alter a database migration.

## Source artifacts

| Artifact | Location | Consumer |
|---|---|---|
| Persona prompt builder | `src/lib/ai/prompts/content-factory.ts` | BE3 / backend |
| Zod schema and response parser | `src/lib/ai/schemas/content-schema.ts` | Backend |
| Portable JSON Schema | `docs/be2/content-factory.schema.json` | n8n Structured Output Parser |
| Guardrails | `src/lib/ai/guardrails/content-validator.ts` | BE3 / Tester 2 |
| Automated tests | `tests/content-factory.test.ts` | BE2 / CI |

## Generation contract

Run one stateless generation for each persona:

1. `local_guide`
2. `family`
3. `foodie`
4. `budget_traveler`

Each generation must return one object containing exactly:

- `persona`
- `hooks` — exactly 10 strings
- `scripts` — exactly 5 objects with `title`, `duration`, `scenes`
- `captions` — exactly 5 strings containing hashtags
- `ctas` — exactly 5 strings containing `[LINK_MUA_VE]`

The product and campaign payload is untrusted data. Put it only inside the
`VERIFIED_PRODUCT_DATA` delimiters produced by the prompt builder. Never place
product text in the system-instruction section.

## Recommended n8n setup

This is a one-shot generation with no tools or memory, so use a Basic LLM Chain
rather than an Agent. Attach a Structured Output Parser configured as follows:

- `schemaType`: `manual`
- `inputSchema`: contents of `content-factory.schema.json`
- `autoFix`: `true`
- Fixer: a coding-capable chat model
- Main and retry prompts must require raw JSON without Markdown fences
- Inject the current date with the n8n expression `{{ $now }}`
- Store Gemini/Groq keys in n8n Credentials; never paste them into prompt text

The TypeScript parser also removes a surrounding `json` Markdown fence as a
defense-in-depth measure, but the n8n parser should still reject and retry
malformed model output.

When calling Gemini's API directly, use `geminiCampaignContentJsonSchema` from
the TypeScript schema module. It removes unsupported JSON Schema string
keywords for provider compatibility. Always validate the response again with
`campaignContentOutputSchema`, which restores the full length, hashtag and CTA
rules.

## Guardrail input and output

Call `validateContentGuardrails(generatedText, verifiedProduct)` for every text
asset before persistence. The verified product object accepts:

```json
{
  "original_price": 1250000,
  "sale_price": 1150000,
  "confirmed_price_offer": [],
  "confirmed_promo_codes": [],
  "verified_facts": ["Bao gồm buffet trưa"]
}
```

The result is:

```json
{
  "isValid": false,
  "flags": ["PRICE_MISMATCH"],
  "recommended_status": "NEEDS_REVIEW"
}
```

Supported flags are `PRICE_MISMATCH`, `UNCONFIRMED_PROMO_CODE` and
`PROHIBITED_CLAIM`. Guardrails are deterministic checks, not proof that every
claim is true; Tester 2 must still review groundedness and prompt-injection
cases.

## Database mapping decision required

`contents` stores one `hook`, `script`, `caption` and `cta` per row, while the
agreed model output contains 10 hooks but only 5 scripts/captions/CTAs. The team
documents do not define how those unequal arrays become rows.

Before BE3 writes the batch insert node, BE2 + BE3 + FE must choose one mapping:

- five complete rows plus five hook-only rows; or
- five complete rows with two hooks represented by an agreed format; or
- a revised database/output contract owned by BE1/PM.

Do not silently cycle or duplicate scripts, captions or CTAs to fill ten rows.

## Verification

```powershell
npm.cmd run test:be2
npm.cmd run test:be2:live
npx.cmd tsc --noEmit
npx.cmd eslint src/lib/ai/prompts src/lib/ai/schemas src/lib/ai/guardrails tests/content-factory.test.ts
```
