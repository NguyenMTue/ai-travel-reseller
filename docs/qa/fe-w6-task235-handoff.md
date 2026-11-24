# TASK-235 / FE-W6-03 — checkout and BE handoff

Worktree: E:/THUCTAP/ai-travel-reseller-fe-w6
Branch: feature/fe-w6-storefront-checkout-revamp
Base: 59d21b4507d7dd28e440591575d1cfe2c542d902

## Verified starting point and scope

Read status/diff before editing and saved the local TASK-233/234 sources separately for preservation checks. Read AGENTS.md, local Next Server/Client guidance, FE-W6-03, UIUX-W6-02, BE1-W6-05 and the TASK-234 QA handoff. No Figma was supplied; the modal follows the repository's three-stage description and existing teal/copper design.

Before changing code, reproduced TASK-234's discrepancy at 320px with valid-unconfirmed ref: tour 950,000 VND / checkout 902,500 VND. Evidence including trace: test-results/checkout-before/.

Only checkout UI, shared total calculation, local booking draft, UI gateway guards, relevant test expectations and test fixtures were changed. Backend routes, DB, tracking, TASK-233 referral resolution and TASK-234 tour/gallery/CTA layouts were not changed. No real transactions or live confirmation requests were made.

## Actual backend contract found in the repository

POST /api/storefront/orders/confirm is a demo attribution writer, not a payment-status query. It accepts orderId and totalAmount from the caller, calls process_order_attribution with p_status="confirmed", or inserts orders/commissions and sets paid_at to the current time. No provider payment verification occurs in that route.

| Response field | Meaning in current code | Payment/ticket evidence? |
| --- | --- | --- |
| success | true even when DB handling falls back to demo | No |
| attributed | true in the normal return, including demo fallback | No |
| dbRecorded | RPC success or successful order+commission insert | Records persisted; not proof of money received |
| orderId | Caller booking reference, not the internal createdOrderId UUID | Correlation only |
| duplicate | RPC reported duplicate booking reference | Neither payment verification nor a new ticket |
| commission.status | Hardcoded confirmed, also in demo/duplicate results | Not payment status |
| message | Human-readable success text, including demo | Do not use as a state transition |

No verified paid status, bank transaction reference, receipt or server-issued ticket/QR is returned. ticketCode in the request is not ticket issuance; the old client fabricated it. The server's local createdOrderId/createdCommissionId variables are not returned. A merchant webhook exists at POST /api/webhooks/merchant/order with HMAC/Bearer verification, but it is not a public guest quote/status/ticket API and the FE must not call it to claim payment.

Production UI therefore does NOT call /orders/confirm. CheckoutGateway is a UI port with NO live adapter; default prepare returns unavailable and performs no network operation. The production payment stage retains the draft and displays a waiting message, with no bank account/VietQR or issued ticket. Repeated clicks cannot turn this into paid status.

## Pricing before / after

Tour Ba Na Hills, standard package, one adult, no children. Page price remains the same as the corrected modal price.

| Case | Modal before | Page + modal after | VietQR |
| --- | ---: | ---: | --- |
| No ref | 950,000 | 950,000 | Production waits for server quote |
| Invalid ref | 950,000 | 950,000 | Production waits for server quote |
| Active valid ref, discount unconfirmed | 902,500 | 950,000 | Production waits for server quote |
| Explicit 5% fixture | 902,500 | 902,500 | Fixture quote amount=902500 |

Confirmed fixture quantities: standard 2 adults + 1 child = 2,481,875 VND; buffet combo 2 adults + 1 child = 3,265,625 VND. The existing 75% child fare is preserved as an estimate pending BE pricing rules. getBookingTotals consumes the same StorefrontPrice as the page; no ref-only discount. The form and local draft share this total. A quote is rejected unless requestId, numeric total, VND currency, VietQR amount and transfer memo match the draft.

## Implemented UI behavior

- Required name, phone and valid non-past travel date; optional email is validated if present; integer adult>=1 / child>=0; invalid/unsafe totals rejected. No fake customer email is generated.
- Form state survives back/edit and closing/reopening the modal. Package changes update the page's selected package. Changed information returns to form; an unchanged back/continue reuses the prepared quote.
- A local draft has a requestId, quantities and estimated totals. It has no orderId, bank account, VietQR, ticket code, ticket QR or payment claim.
- A synchronous lock plus disabled controls prevents repeated in-flight sends. HTTP/network/abort failures keep draft/requestId/quote and offer retry. A changed revision gets a new requestId and carries supersedesOrderId to the UI adapter; BE must define atomic replacement/cancellation.
- An explicit user transfer claim only checks status through the supplied gateway. Pending/unknown/demo/dbRecorded/commission/duplicate responses do not produce tickets.
- The proposed paid-evidence guard requires paid status, paymentVerified=true, matching requestId+orderId+amount+VND, a valid paidAt and transactionId, plus a server ticket bound to the same order with code/QR payload. The client only renders/saves that supplied payload as a QR; it does not issue/sign/create tickets.
- Focus is contained in the dialog, errors receive focus, body scrolling is locked, controls have 48px targets, and Sticky CTA remains hidden while modal is open.

## Fixture contract is not an existing BE endpoint

tests/fixtures/checkout-view.tsx supplies a test-only gateway using /__fixtures__/checkout/prepare and /check, intercepted by Playwright. Those paths have no application API route. No production route imports the fixture adapter. The positive payment/ticket payload is a PROPOSED UI-port model, not a claim that current BE can confirm payment or issue tickets. The test-only page /storefront/fixture-checkout is generated by the fixture launcher and removed after QA; it must not be committed.

## BE1 delivery required before real payment can be enabled

1. Guest-safe quote/order creation endpoint with an idempotency key/requestId. Recompute catalog price, package/date/quantities and authorized discount on server; do not trust FE amounts/discount flags. Return canonical orderId, request binding, totalAmount, currency, validated bank/VietQR instructions and expiry. Define the child fare and inventory rules.
2. Authenticated/non-enumerable read-only status endpoint bound to the guest's quote/token. Define pending/paid/failed/expired states and the trusted transaction/receipt fields. A user clicking a transfer button must not write paid/confirmed or credit wallets.
3. Server-issued ticket code and signed QR payload bound to the verified paid order. Define delivery/download behavior; FE must not claim SMS/email delivery without evidence.
4. Database uniqueness/atomic idempotency for retries, bank event replay, commissions and ticket issuance. Define timeout reconciliation and quote cancellation/replacement on back/edit. Current UI duplicate suppression is not a backend exactly-once guarantee.
5. Agree the transport mapping into CheckoutGateway. The proposed guard field names in checkout.ts must not be silently mapped from legacy success/dbRecorded/commission.status.

## Reproduction / QA

Without runtime env files: node tests/fixtures/start-storefront-checkout.mjs. This starts the read-only local PostgREST fixture and Next at 3216/3217, generates the two guarded fixture pages and refuses to overwrite existing pages. Real env values are not read/copied; no DB/payment/AI/Telegram call is made.

Browser commands (set PLAYWRIGHT_CHROMIUM_PATH to an installed Chromium if required):

- npm run test:ui -- --config=playwright.storefront-checkout.config.ts --output=test-results/checkout-verified
- npm run test:ui -- --config=playwright.storefront-mobile.config.ts --output=test-results/mobile-after-checkout --trace=retain-on-failure
- npm run test:ui -- --config=playwright.storefront-referral.config.ts --output=test-results/referral-after-checkout --trace=retain-on-failure

Logic tests: node --experimental-strip-types --test tests/storefront-checkout.test.mjs tests/storefront-pricing.test.mjs tests/storefront-referral.test.mjs.

The seven offline Storefront tests (SF-01..06 and SF-08) run without env; SF-07 is explicitly excluded because it invokes the legacy confirmation writer. Old SF-02/08 assertions requiring client-issued tickets were replaced by draft/price assertions. TASK-234's valid-unconfirmed expected modal price was changed from 902,500 to 950,000; all other referral/tour expectations are preserved.

Check screenshots for 320/390/768/1440. The successful checkout fixture covers pending, demo success with dbRecorded=false, recorded-only success, wrong-order evidence, then verified server ticket; failure fixture covers HTTP error, network loss and retries with a stable request/order. Download is a PNG generated from the supplied server fixture QR payload. There is no real-data or live payment verification; iOS/TikTok device behavior, final Figma and real BE adapter remain pending.

HEAD baseline has 11 TypeScript errors in auth, tracking API, merchant video modal and ffmpeg compositor. Keep those separate from new errors. Checkout rewrite removes its existing set-state-in-effect lint error; the three pre-existing any errors in the unchanged data resolver remain outside this task. git diff --check and preservation checks must pass before handoff.

## Final verification (2026-11-19)

- Checkout: 20/20 passed, including QR download; TASK-234 tour/CTA: 20/20 passed. Both ran at 320, 390, 768 and 1440px. Referral UI: 10/10 passed, including desktop identity. No desktop missing-card failure reproduced in this run; retain-on-failure tracing was enabled.
- Offline legacy storefront tests: 7/7 passed (SF-07 excluded). Checkout/pricing/referral logic: final isolated run 8/8 passed; resolver test took 167ms. An earlier concurrent run was 7/8: the unchanged TASK-233 resolver returned no resellerName after 1626ms, with its existing 1200ms abort timeout. This is intermittent referral behavior, not a newly changed checkout resolver; do not treat the isolated pass as resolving it. No browser trace exists for that Node unit-test failure.
- Initial checkout browser attempt had eight strict locator failures from matching both the dialog alert and Next route announcer. Scoping assertions to the dialog fixed the test; subsequent checkout runs passed 20/20. Initial failure artifacts remain under test-results/checkout-after; baseline price trace remains under test-results/checkout-before. Final screenshots: test-results/checkout-verified; regression outputs: mobile-after-checkout and referral-after-checkout.
- Temporary fixture pages were removed after QA. Prior TASK-233/234 files outside the explicitly extended checkout/shared-price/test integration files match the pre-task snapshot. All changes remain local and uncommitted.

Final compiler audit after fixture cleanup: TypeScript has 11 errors both at HEAD and in the working tree, with no new diagnostics. They are in auth.ts, tracking/generate/route.ts, merchant/video-generate-modal.tsx and video-engine/ffmpeg-compositor.ts. The full changed-file lint comparison is HEAD 5 errors / current 3, all three remaining errors are pre-existing no-explicit-any in data.ts; no introduced errors. Dedicated TASK-235 lint passes. git diff --check passes. No changes to backend confirm route, package manifests/lockfile or tsconfig.json. Week-5 worktree still has its existing FE_W5.md, TEAM_WORK_LOG.md and tsconfig.json changes. Only the QA-owned fixture process tree was stopped.

## Portable handoff note

See [fe-w6-reproduce.md](./fe-w6-reproduce.md) for clean-checkout setup, exact fixture/test commands and screenshot/trace regeneration. Local test-results/build evidence is not part of the Git handoff. TASK-234 historical modal prices precede the TASK-235 correction. Payment sandbox verification remains pending BE1; TASK-236 remains waiting for Tester 3 delivery. Any E:/THUCTAP paths in this report are historical local locations, not required files for running the committed tests. The TASK-236 report includes the search metadata needed to understand its conclusion; its local raw evidence JSON is supplementary only.

## Merge origin/dev — 2026-11-24

Starting FE HEAD/remote: 156ec4fded4abf57d7eb0a79ebb2dc9d1028374a; working tree was clean. Explicit fetch updated dev to 6b25b6cf15f1178c1a0e81c79b588d7a9f4903ec. FE local/remote ahead/behind was 0/0, so no collaborator commits required synchronization. Merge base: 59d21b4507d7dd28e440591575d1cfe2c542d902. Merge was held without committing until validation finished.

Two content conflicts were reviewed against index stages 1/2/3 and each branch's diff:

- storefront-checkout-modal.tsx: retain shared selected-package totals, explicit discount eligibility, cached drafts, retry locks and verified-ticket guard from TASK-235. Preserve dev's keyboard intent using native Enter/Space buttons with aria-pressed inside a labelled package group. Keep mobile inputs at 16px. Extra computed-style QA found the existing unlayered global font:inherit overrode text-base on both old FE and dev; the local input class now enforces text-[16px]! without changing globals. The added regression checks keyboard selection and actual computed input size at every viewport.
- storefront-sticky-cta.tsx: retain the shared StorefrontPrice prop, selected-package amount, 48px control, modal suppression and mobile-only layout; port dev's max(12px, safe-area) bottom padding as max(0.75rem, env(safe-area-inset-bottom)). Incoming viewportFit:cover in app/layout.tsx is retained.

All other updates from dev, including BE, schema migrations, portal components and QA sources, are retained. No backend/schema changes were made as conflict resolutions. Referral resolver/card and explicit voucher eligibility were not conflicted: a valid ref alone continues to show 950,000 VND for the first Ba Na package; the explicit 5% fixture shows 902,500. Changes of package and guest counts still use one pricing source across the page, Sticky CTA and checkout.

### New payment contract inspected

- GET /api/storefront/orders/status now exists: returns success, orderId, status and isPaid from cache or paid/completed DB status. It returns no canonical amount/currency/transaction evidence or issued ticket.
- POST /api/webhooks/bank/vietqr optionally checks a secret only when configured; marks the paid cache before the DB lookup, and does not reconcile received amount against order amount. Therefore the status payload alone is not verified order-and-ticket evidence for this FE flow.
- POST /api/storefront/orders/confirm now returns eTicket, but still returns it from demo fallback (dbRecorded=false), uses the caller's booking reference/amount and is not a provider payment verifier. eTicket/verifiedAt does not make the demo paid.
- Incoming isPaid-only polling/auto-advance was deliberately not enabled. The default FE gateway still performs no live confirm/status calls and shows waiting until BE supplies an authoritative quote plus verified payment and an issued ticket bound to the same order. Regression fixtures explicitly cover the new isPaid-only and demo-eTicket payloads and keep both pending; only the proposed fully verified ticket fixture opens E-Ticket. No real payment, webhook or DB operation was executed.

### Validation and baseline comparison

- Checkout/pricing/referral logic: 9/9 pass. Legacy offline storefront: 7/7 pass; SF-07 excluded because it invokes the legacy confirmation writer.
- Browser fixture: checkout 20/20, Storefront mobile 20/20 at 320/390/768/1440px; referral 10/10 at 390/1440px. Checkout/mobile were rerun after the computed-font correction; the final checkout run also checks Enter/Space selection and >=16px input font. No missing desktop referral card reproduced. Viewed 320px footer/CTA and edited-quote screenshots.
- Artifacts remain ignored: test-results/merge-dev-20261124-checkout-font, merge-dev-20261124-mobile-font and merge-dev-20261124-referral. Recreate with the launcher/commands in fe-w6-reproduce.md, replacing --output accordingly. Initial runs before the font correction remain under merge-dev-20261124-checkout/mobile. The supplemental computed-font smoke initially failed on inherited 14px; this led to the explicit font correction and final regression assertions.
- TypeScript compiler comparison against exact fetched dev: 1 error in both trees, zero introduced. Existing error: app/api/admin/fraud/dismiss/route.ts, TS2339, user is absent from the allowed admin-access result. Earlier 11-error reports describe the old dev baseline, not the new one.
- Lint of all FE-different TS/TSX/MJS files compared against dev: dev 5 errors / merged 3 errors, zero introduced; remaining three are existing no-explicit-any in data.ts. Scoped lint of conflict resolutions and checkout tests passes.
- git diff --cached --check reports 62 whitespace issues, all identical to the incoming dev diff; zero introduced by conflict handling. No unrelated Markdown hard breaks, Python, SQL or other members' files were reformatted to hide them. git diff --cached --check origin/dev -- passes for the FE delta. No unmerged entries or conflict markers remain.
- Incoming live QA suites storefront-referral-checkout, mobile-compatibility-w6 and commission-idempotency-audit were preserved, not run as fixture acceptance: they assume the old ref-only discount / transfer-claim workflow, can invoke the live confirmation writer and write tracked screenshot evidence. Their earlier PASS reports are not claimed as validation of this guarded FE merge. Real API/payment sandbox remains unverified.

The three Tester 3 components now exist in fetched dev. TASK-236's report is a historical 19/11 discovery result; this merge does not constitute reviewing/accepting those components. No PR, approval, dev push or force-push is part of this operation.
