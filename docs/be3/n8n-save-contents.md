# BE3: Campaign content pipeline and persistence

## Target flow

```text
Campaign INSERT → Webhook → POST /campaigns/enrich → Gemini structured output
→ Structured Output Parser (auto-fix) → deterministic guardrails → mapper
→ POST /contents/batch → Supabase public.contents
```

The existing file `services/llm-service/workflow_ai_travel_review.json` is an
older review workflow, not an export of this Campaign Content pipeline. Export
the actual workflow from the connected n8n instance as
`services/llm-service/workflow_campaign_content.json` after its live nodes and
credentials are checked. Remove credential values before committing; n8n
credential references/IDs must also be reviewed for portability.

## API contract

Python keeps `SUPABASE_KEY` server-side. n8n uses only the separate
`CONTENTS_API_KEY` credential. Do not put either key in a prompt, workflow
parameter, export, Google Sheet, or frontend bundle.

The final HTTP Request node sends JSON to
`http://host.docker.internal:8000/contents/batch` when n8n is in Docker on the
same Windows host. Use the reachable Python host address if n8n runs elsewhere.
Send `X-API-Key` through an n8n Header Auth credential and send a JSON body.
For the demo, keep n8n local at `127.0.0.1:5678` and the Python API local at
`127.0.0.1:8000`; Cloudflare is unnecessary between those two services. If the
Supabase database itself is cloud-hosted, however, its Database Webhook cannot
reach a local-only n8n URL. In that case use a reachable HTTPS webhook address
for the trigger, or run the demo against local Supabase.

One request contains one persona and exactly ten mapped rows. For the Sprint 2
demo, map the ten hooks to the five generated scripts, captions and CTAs using
the same modulo index (`assetIndex = hookIndex % 5`), so all ten FE variants
have a complete content kit. The API also accepts the legacy contract where
rows 6–10 are hook-only; partial kits are rejected. Scripts may be objects
`{title, duration, scenes}`; the API formats them as readable text. Do not include IDs, product_id, `reseller_id`,
`generation_key`, or `status`; Python derives/verifies those values.

```json
{
  "campaign_id": "UUID-CAMPAIGN-THAT",
  "records": [
    {
      "persona": "family",
      "hook": "Một hook thực tế có độ dài theo schema BE2",
      "script": {
        "title": "Một hành trình vui vẻ cùng gia đình",
        "duration": 35,
        "scenes": [
          "Cả nhà bắt đầu chuyến đi cùng nhau.",
          "Khám phá điểm đến nổi tiếng trong ngày.",
          "Cùng lưu lại những kỷ niệm đáng nhớ."
        ]
      },
      "caption": "Cùng gia đình khám phá điểm đến hấp dẫn! #DuLich",
      "cta": "Đặt vé ngay tại [LINK_MUA_VE] để giữ chỗ."
    }
  ]
}
```

The abbreviated payload above shows one full row only; a live request must have
all ten rows. In the demo mapper, use `data.scripts[index % 5]`,
`data.captions[index % 5]`, and `data.ctas[index % 5]` for each hook, formatting
script objects with `scriptToText` if needed. The API rejects wrong row counts,
mixed personas, incomplete first-five assets, partial assets in rows 6–10, and
extra fields such as a model-supplied status. Rows 6–10 may still be hook-only
for compatibility with earlier batches.

The key mapping change in the existing Code mapper is:

```js
const records = data.hooks.map((hook, index) => {
  const assetIndex = index % 5;
  return {
    persona: data.persona,
    hook,
    script: scriptToText(data.scripts[assetIndex]),
    caption: data.captions[assetIndex],
    cta: data.ctas[assetIndex],
  };
});
```

Keep the mapper's existing campaign ID lookup and output shape
`{ campaign_id, records }`; the expression above replaces the old
`index < 5 ? ... : null` asset mapping.

## Validation and status

`/contents/batch` reloads the campaign and product from Supabase, formats the
content, then runs deterministic checks for prices, unconfirmed promo codes,
and prohibited claims against product facts. It assigns lowercase `approved`
only when no check flags the batch; otherwise it assigns `needs_review` to all
ten rows. Gemini cannot choose persistence status. These checks are guardrails,
not proof that every statement is true, so review generated content.

Validation caps mirror BE2: hook 20–100 characters; caption 40–2,200 with a
hashtag; CTA 15–300 with `[LINK_MUA_VE]`; script object has 30–45 second
duration and 3–8 scenes, each 10–500 characters. The API currently validates
the shape and required content but the n8n Structured Output Parser should also
use `docs/be2/content-factory.schema.json` with auto-fix enabled.

## Basic LLM Chain prompt and persona runs

Use the complete schema file above in the Structured Output Parser. It includes
the caption hashtag pattern; the schema pasted in the integration note must
retain this property:

```json
"pattern": "#[\\p{L}\\p{N}_]+"
```

The CTA pattern in the JSON file must be exactly
`"pattern": "\\[LINK_MUA_VE\\]"` (two escaped backslashes in the JSON
source). Do not double-escape it to four backslashes.

In **Basic LLM Chain → Chat Messages → Prompt 1 (System) → Message**, use a
prompt that explicitly names the one persona for the current item:

```text
Bạn là chuyên gia tạo nội dung du lịch. Dựa trên dữ liệu chiến dịch, sản phẩm
và thông tin tham khảo đã được cung cấp trong User Message, hãy tạo nội dung
cho đúng persona: {{ $json.persona }}.

Chỉ trả về đúng một JSON object cho persona này, không sinh nhiều persona.
Chỉ dùng các key: persona, hooks, scripts, captions, ctas.
Không thêm variants, hashtags, lời giải thích hay key nào khác.

Yêu cầu:
- persona phải đúng bằng {{ $json.persona }}.
- hooks gồm đúng 10 chuỗi, mỗi chuỗi 20–100 ký tự.
- scripts gồm đúng 5 object; mỗi object có title (chuỗi), duration (số nguyên 30–45), scenes (mảng 3–8 chuỗi).
- captions gồm đúng 5 chuỗi, mỗi chuỗi 40–2200 ký tự và có ít nhất một hashtag như #DuLich.
- ctas gồm đúng 5 chuỗi, mỗi chuỗi 15–300 ký tự và chứa nguyên văn [LINK_MUA_VE].
- Không dùng chuỗi cho scripts; không thêm thuộc tính ngoài schema.
- Trả JSON thuần, không Markdown fence, không lời dẫn.
```

Make sure the item reaching the chain actually has `persona` and the campaign
context. For the four-persona demo, run the chain once per persona with
`local_guide`, `family`, `foodie`, and `budget_traveler`; do not ask one model
response to contain all four. The old prompt in
`services/llm-service/content_generator.py` is for a legacy Groq generator and
returns a different structure (`scripts` as strings plus `hashtags`); do not
use it as the n8n Content Factory prompt.

If the parser still rejects a result, temporarily execute the chain without
the Structured Output Parser to inspect the raw model response, then restore
the parser and its schema. Check the raw response for Markdown, truncated JSON,
wrong array counts, string-valued `duration`, or unsupported keys before
changing the schema.

## Retry and duplicate protection

The HTTP Request node should retry transient failures (429 and 5xx) with a
bounded delay, for example 3 attempts and 5 seconds between attempts. Do not
retry validation/authentication errors (4xx other than 429). Keep the
workflow's error output connected so the final failed execution is visible.

The Python API uses a deterministic key per campaign/persona/row and an
upsert with duplicate-ignore semantics. This requires `public.contents.generation_key`
and a unique index on that column. The Supabase CLI is not installed in the
current workspace, so the migration has not been generated or applied here;
until it is, the API will return 502 when it reaches the upsert. Generate the
migration with the project's Supabase CLI, then include and review:

```sql
ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS generation_key text;

CREATE UNIQUE INDEX IF NOT EXISTS contents_generation_key_uidx
  ON public.contents (generation_key);
```

Apply the migration to the test project before E2E. Do not claim duplicate
protection is live before that migration is applied.

On repeated delivery after the migration, the endpoint returns the same ten
IDs and `inserted_count: 10`; `inserted_count` here means persisted batch rows,
including rows already present from an earlier attempt.

## E2E acceptance evidence

Run only against a test campaign/product and test Supabase project:

1. Create a campaign in FE and confirm its `INSERT` reaches n8n.
2. Confirm the workflow traverses enrichment, Gemini, parser, guardrails,
   mapper, and `/contents/batch`.
3. Confirm the API response is HTTP 201, `inserted_count` is 10, and status is
   either `approved` or `needs_review` based on the server's guardrail result.
4. Query `contents` by campaign and persona: there must be exactly ten rows.
   For the demo contract, all ten rows should have script, caption and CTA.
5. Re-run the same batch and confirm the same ten IDs remain, with no added
   rows.
6. Confirm FE reads the lowercase `approved` rows.
7. Simulate transient 429 and 503 responses in a staging workflow, capture the
   execution retry history, and confirm a permanent 422 is not retried.

No live workflow export or external E2E was available in this workspace. Keep
the workflow JSON, redacted execution evidence, and updated BE3 completion
report as handoff artifacts after performing those checks in n8n/Supabase.
