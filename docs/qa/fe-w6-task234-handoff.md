# TASK-234 / FE-W6-02 — local QA handoff

Worktree: E:/THUCTAP/ai-travel-reseller-fe-w6
Branch: feature/fe-w6-storefront-checkout-revamp
Base HEAD: 59d21b4507d7dd28e440591575d1cfe2c542d902

## Scope and design basis

Based on FE_W6.md and UIUX-W6-01/04 descriptions, not a supplied Figma. Existing teal/copper colors, rounded package cards, itinerary and referral UI are preserved. Adjusted gallery tabs to wrap as whole buttons at 320px. Added package selection pills, readable mobile spacing/text, shared display pricing, 48px CTA targets, safe-area bottom padding and hiding of Sticky CTA while checkout is open. The pill selection updates both price surfaces and the package passed to checkout. Sticky CTA is hidden at 768px and above. No new backend/payment behavior.

TASK-233 changes remain local and intact. Only its view and price-card integration were extended; header, referral-card, referral resolver/types and its tests were not edited in TASK-234.

## Pricing observed in Chromium with local fixtures

Tour: Ba Na Hills, first package; original 1,250,000 VND, sale 950,000 VND. Modal defaults: 1 adult, 0 children. Same observations at 320, 390, 768 and 1440px; Sticky CTA is intentionally hidden at 768/1440.

| Referral case | Price card / mobile Sticky CTA | Existing modal | Outcome |
| --- | ---: | ---: | --- |
| Missing ref | 950,000 | 950,000 | Match |
| Invalid ref | 950,000 | 950,000 | Match |
| Valid active ref, eligibility unconfirmed | 950,000 | 902,500 | Existing checkout mismatch; TASK-235 |
| Explicitly confirmed 5% fixture | 902,500 | 902,500 | Match in fixture; not proof of real eligibility |

The second package (Buffet Combo) changes both display prices and modal selection to 1,250,000 VND without a referral. A ref alone never discounts display prices. Only explicit discountEligible=true + discountPercent=5 with a resolved referral identity activates the display discount, using the same source package price and rounding for both surfaces.

## TASK-235 reproduction

1. In a checkout without runtime env files, run: node tests/fixtures/start-storefront-mobile.mjs
2. Open http://127.0.0.1:3216/storefront/sunworld/ba-na-hills?campaign=44444444-4444-4444-4444-444444444444&ref=22222222-2222-2222-2222-111111111111
3. Observe price card and mobile Sticky CTA: 950,000 VND. Scroll to the page end and open checkout. Keep 1 adult / 0 children.
4. Modal advertises a referral discount of 47,500 VND and total 902,500 VND despite eligibility being unconfirmed. No form submission/payment is needed to reproduce.

Existing checkout code uses tracking.refCode to calculate a 5% reduction. TASK-234 intentionally leaves this calculation and booking helper unchanged. BE/TASK-235 must establish authoritative discount eligibility and align modal/payment totals with that contract; the display helper is not payment authorization.

The launcher creates a temporary guarded page at /storefront/fixture-confirmed for the positive voucher fixture. It must not be committed. Remove it after stopping the owned fixture runner if the process was force-stopped. The /storefront prefix avoids an existing proxy behavior that treats 127.0.0.1 as tenant 127 and rewrites other paths; proxy was not modified.

## Validation and limits

- TASK-234 Playwright: 20 cases passed, four viewport widths (320/390/768/1440), including package selection and scroll-to-bottom CTA opening. Browser requests are limited to the local app; no order/payment endpoint is called. Screenshots: test-results/storefront-mobile/.
- TASK-233 referral regression: 10 cases passed at 390/1440px; run npm run test:ui -- --config=playwright.storefront-referral.config.ts --output=test-results/referral-regression against the same local runner.
- Logic tests: node --experimental-strip-types --test tests/storefront-pricing.test.mjs tests/storefront-referral.test.mjs (3 passed).
- One intermediate referral run had 9/10 passing (desktop valid-ref lacked resolved identity). The isolated rerun passed 2/2 and final full rerun passed 10/10 without changing TASK-233 code/tests. Resolver has an existing 1.2s timeout/fallback; latency is a possible cause, not proven by the observation. Failed evidence is retained under test-results/referral-regression; final passing evidence under test-results/referral-final.
- Lint the changed components, pricing.ts, new config/tests/launcher; no new lint errors. Existing checkout/data lint errors remain outside this task.
- TypeScript HEAD baseline has 11 existing errors in auth, tracking API, merchant video modal and ffmpeg compositor. No task-specific TypeScript errors were observed. This does not mean the full repository typecheck passes.
- No .env.local or real-data verification. Fixture-backed identity, product and pricing only; external media is blocked. No physical iOS safe-area/in-app-browser or sustained 60 FPS certification. Figma and the authoritative 5% eligibility API are still pending.

## Portable handoff note

See [fe-w6-reproduce.md](./fe-w6-reproduce.md) for clean-checkout setup, exact fixture/test commands and screenshot/trace regeneration. Local test-results/build evidence is not part of the Git handoff. TASK-234 historical modal prices precede the TASK-235 correction. Payment sandbox verification remains pending BE1; TASK-236 remains waiting for Tester 3 delivery. Any E:/THUCTAP paths in this report are historical local locations, not required files for running the committed tests. The TASK-236 report includes the search metadata needed to understand its conclusion; its local raw evidence JSON is supplementary only.
