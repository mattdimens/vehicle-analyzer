# Open items

The one list of what's still to do on Visual Fitment: things waiting on Matt, scheduled checks, and code work. Claude updates it at the end of each session: tick off what got done (move it to "Done recently" with the date and PR), add anything new to its section, and re-rank "Priorities". Detail stays in the linked docs; each item here is one or two lines.

Last updated: 2026-10-30.

## Priorities

Every open item below, in the order to do it. Ranked by what moves the Tacoma pilot toward its 8-week gate ([plan 2.3](vehicle-pages-plan.md#23-gate-to-expand-8-weeks-after-launch)), then by risk, then by effort. Dated checks sit where their date falls.

| # | Item | Who | When | Why this rank |
|---|---|---|---|---|
| 1 | Privacy contact address | Matt | Now (5 min) | The privacy policy still says a contact address is coming. Google Analytics' terms and the Amazon Associates agreement require accurate privacy disclosure ([REVIEW.md](../REVIEW.md), N3), so it's a small fix with real risk. |
| 2 | Request indexing for `/vehicles/toyota/tacoma/seat-covers` | Matt | Now (live since 2026-10-30) | The first product-type page, and the kind of page the gate depends on. |
| 3 | Product research: 4th Gen next, then 2nd and 1st Gen | Claude, Matt approves each PR | Paused by Matt on 2026-10-30; resume when Matt says | The gate needs product-type pages that rank. The 3rd Gen pass is done (see Code). |
| 4 | Four-week check on the redesign, plus re-running the corrected clicks query | Matt and Claude | Around 2026-11-27 | First real read on whether picks get clicked, and the first with Amazon prices on the cards. Run both together. |
| 5 | Amazon cache follow-ups: Sort control and a weekly unavailable-listings report | Claude | When convenient | Prices are live, so Sort can show now. The report catches dead listings before visitors do. |
| 6 | ESLint 10 and TypeScript 7 | Claude | Recheck in December | Held back from the October upgrades until the lint plugins support them (see Code). Nothing breaks while we wait. |
| 7 | Tacoma generation facts for the hub table | Matt | When convenient | Adds useful content to the hub, but the hub works without it. |
| 8 | Cabs and beds for the 4th, 2nd and 1st Gen | Matt | With each generation's first picks | The filter only matters once a generation has researched picks, so add them alongside #3's research. |
| 9 | 8-week expansion gate | Matt and Claude | Around 2026-12-25 | Decides whether to expand to Gladiator, 4Runner and Bronco. |

## Waiting on Matt

- [ ] **Request indexing** for `/vehicles/toyota/tacoma/seat-covers`, the first product-type page (live since 2026-10-30).
- [ ] **Tacoma generation facts** for the hub's "How the generations differ" table: cabs, beds, engines, what carries over, for each generation. A row only shows when all four generations have it. Current values and TODOs: `specs` in [data/vehicles/toyota.ts](../data/vehicles/toyota.ts).
- [ ] **Cabs and beds for the 4th, 2nd and 1st Gen** (`configs` in `toyota.ts`), to turn on the "Your truck" filter on those pages.
- [ ] **Privacy contact address.** Set `CONTACT_EMAIL` in [app/privacy/page.tsx](../app/privacy/page.tsx); the email line appears on its own ([REVIEW.md](../REVIEW.md), manual step 1).

## Scheduled checks

- [ ] **Around 2026-11-27: four-week check on the redesign** (the brief's "How we'll measure success"). GA4 Explore: `affiliate_click` by Link type and Product type, `vehicle_fit_selected` by Fit method, `vehicle_year_selected` count. Search Console: impressions and position for the 5 Tacoma URLs. Supabase: the clicks-by-ASIN query in the brief. The custom dimensions were registered 2026-10-30, so GA4 data starts then.
- [ ] **Late November: re-run the corrected clicks query** in [plan section 9](vehicle-pages-plan.md#9-first-party-data-to-pull). The first run counted bot traffic from before the 2026-10-20 filter.
- [ ] **8-week expansion gate** ([plan 2.3](vehicle-pages-plan.md#23-gate-to-expand-8-weeks-after-launch)): check at 4 weeks, decide at 8. Counting from the redesign launch on 2026-10-30, the decision is around 2026-12-25.

## Code

- [ ] **Product research**, paused by Matt on 2026-10-30. Process: [plan section 4](vehicle-pages-plan.md#4-product-research-process), with the 2026-10-30 rule calls in section 4.3 (newer-vehicle bar, product-line record, the high-volume rule read in Matt's signed-in Chrome, no lift kits, no bed covers or RealTruck brands). Live: 3rd and 4th Gen seat covers, 3rd Gen floor mats and 3rd Gen running boards. Paused for the 3rd Gen because too few Amazon listings pass: bed racks, bumpers and skid plates, wheels, roof racks, headlights. Next: the 4th Gen, then the 2nd and 1st Gen.
- [ ] **Amazon cache follow-ups:** the Sort control (now that prices show) and a weekly report of listings unavailable for 3 or more days ([plan 8.3](vehicle-pages-plan.md#83-build-steps), step 5). The cache refreshes daily at 10:00 UTC; Vercel's Hobby plan allows one cron run a day, so prices drop out for an hour or two each day.
- [ ] **ESLint 10 and TypeScript 7**, held back. ESLint 10 runs, but `eslint-config-next`'s import, jsx-a11y and react plugins don't support it yet. TypeScript 7 builds, but `typescript-eslint` 8 can't lint with it. Retry each once its plugins support it.

## Done recently

- 2026-10-30: Research PRs merged: 4th Gen seat covers, which publishes `/vehicles/toyota/tacoma/seat-covers` ([#45](https://github.com/mattdimens/vehicle-analyzer/pull/45)); 3rd Gen floor mats ([#47](https://github.com/mattdimens/vehicle-analyzer/pull/47)); 3rd Gen running boards ([#48](https://github.com/mattdimens/vehicle-analyzer/pull/48)); and the fix that shows the normal card for items the Creators API hides ([#46](https://github.com/mattdimens/vehicle-analyzer/pull/46)).
- 2026-10-30: Amazon price, image and stock on the vehicle cards, from an `amazon_items` cache refreshed daily ([PR #44](https://github.com/mattdimens/vehicle-analyzer/pull/44)). Production migration, `CRON_SECRET` and the first fill done; the Carhartt covers showed $272.97. #44 also added the RealTruck rule to plan 4.3 (no bed covers, no RealTruck-owned brands).
- 2026-10-30: Research paused by Matt after the 3rd Gen pass. Matt's rule calls are recorded in plan 4.3.
- 2026-10-30: Major-version upgrades: Lucide 1, react-dropzone 20, `@types/node` 22 and the Gemini SDK 2. Matt tested a vehicle and a part photo on the preview ([PR #40](https://github.com/mattdimens/vehicle-analyzer/pull/40)).
- 2026-10-30: Product-type page on the light layout, with one shared guides list ([PR #38](https://github.com/mattdimens/vehicle-analyzer/pull/38)).
- 2026-10-30: Dependency updates within ranges, React 19.3, and the zod advisory fix; `npm audit` is clean ([PR #39](https://github.com/mattdimens/vehicle-analyzer/pull/39)).
- 2026-10-30: Demand logging uses the shared High band (80 or more) instead of a hardcoded 85 ([PR #41](https://github.com/mattdimens/vehicle-analyzer/pull/41)).
- 2026-10-30: The unused `variant="preview"` branch in `results-display.tsx` turned out to have been deleted on 2026-10-11 ([PR #5](https://github.com/mattdimens/vehicle-analyzer/pull/5)). `REVIEW.md` N10 still said it was there, and is corrected.
- 2026-10-30: Search Console indexing requested for the 5 Tacoma URLs and the 5 pages Google didn't seem to know (`/truck-bed-covers`, `/blog`, `/vehicles`, `/vehicles/toyota`, `/blog/running-boards-buying-guide`).
- 2026-10-30: Vercel Firewall rate-limit rule added for the analysis endpoints ([REVIEW.md](../REVIEW.md), manual step 2).
- 2026-10-30: Vehicle pages redesign, all three steps: generation page layout (#32), "Your truck" fit filter (#33), model hub (#34). The hub ships without the comparison table until the facts above are in.
- 2026-10-30: GA4 custom dimensions registered for `product_type`, `cab`, `bed`, `page`, `year`, `generation`, `platform` and `entry_door` (`link_type` and `method` were already there).
