# BE2 review of BE3 Campaign Content integration

**Source branch:** `origin/Feature_BE3_n8n_Campaign_Content@6ae494e`  
**Reviewed on dev:** `origin/dev@49d3032`
**Review date:** 16/10/2026  
**Outcome:** `DEMO MAPPING DOCUMENTED — LIVE ACCEPTANCE PENDING`

## Verified in this review

- The code merged into `dev` contains authenticated `/campaigns/enrich` and `/contents/batch` endpoints, a `generation_key` migration, n8n integration guidance and isolated Python tests.
- The checked-in BE2 suite passes after syncing with `dev`: 17/17 tests.
- `services/llm-service/rag_api.py` and `tests/test_rag_api_contents.py` compile successfully with Python 3.13.
- The BE3 completion report itself remains `IN_PROGRESS` and does not claim the complete Week 2 workflow is accepted.

The BE3 Python suite was independently executed in an isolated temporary
environment: 8/8 tests passed against a mocked Supabase client. The FE
approved-content contract also passed 14/14 data tests. This is useful unit and
integration-contract evidence, but it is not live persistence evidence.

## Blocking contract conflict

The BE2 output contract produces one persona object with ten hooks and five scripts, captions and CTAs. The accepted BE2 reference mapper intentionally creates:

- rows 1–5: hook + script + caption + CTA;
- rows 6–10: hook only;
- no cycling or duplication of the five non-hook assets.

The BE3 integration guide instead instructs n8n to use `index % 5`, duplicating each script, caption and CTA across ten complete rows. The BE3 API accepts both layouts, but accepting both does not resolve which layout is authoritative.

`origin/dev@49d3032` adds a BE1–BE3 agreement that documents modulo mapping as
the preferred demo override so all ten FE variants are populated. This resolves
the immediate demo presentation choice, but it does not change BE2's canonical
10/5 generation schema. If ten independently generated complete variants are
required after the demo, the clean contract is to change the schema to ten
scripts, ten captions and ten CTAs, then update the prompt, mapper, tests and
token budget together.

## Additional changes required before acceptance

1. Keep the Structured Output Parser on the strict BE2 schema: scripts are objects, not legacy strings; output contains no `variants`, `hashtags` or model-supplied status.
2. Regenerate `src/lib/database.types.ts` after applying the `generation_key` migration.
3. Export the actual Campaign Content n8n workflow without credentials or secret values.
4. Provide a live test execution for each of the four personas and verify exactly ten persisted rows per persona.
5. Verify retry behavior for 429/503 and confirm validation/authentication failures are not retried.
6. Verify the FE can read the resulting lowercase `approved` rows for the test campaign.
7. Rename or clarify `inserted_count`: on an idempotent retry it currently reports the ten rows found after persistence, not the number of newly inserted rows.

## Work completed by BE2 while live access is pending

- Added `src/lib/ai/content-batch.ts` as the executable source of truth for the
  request body consumed by BE3's `POST /contents/batch` endpoint.
- Verified all four personas produce ten records with five complete kits and
  five hook-only records, without modulo cycling.
- Added deterministic rejection coverage for script strings, captions without
  hashtags, CTAs without `[LINK_MUA_VE]`, and model-added keys.
- Re-ran BE3's eight API tests and FE's fourteen approved-content contract
  tests successfully.

## Acceptance decision

The BE3 integration and demo mapping decision are now present on `dev`, but the
merge itself is not evidence that BE2-W2-04/05 or BE3-W2-03/06 are complete.
Live acceptance remains blocked on generated database types, workflow export
and live E2E evidence. The canonical post-demo mapping still needs owner review.
