# Open items

The one list of what's still to do on Visual Fitment: things waiting on Matt, scheduled checks, and code work. Claude updates it at the end of each session: tick off what got done (move it to "Done recently" with the date and PR) and add anything new. Detail stays in the linked docs; each item here is one or two lines.

Last updated: 2026-10-30.

## Waiting on Matt

- [ ] **Tacoma generation facts** for the hub's "How the generations differ" table: cabs, beds, engines, what carries over, for each generation. A row only shows when all four generations have it. Current values and TODOs: `specs` in [data/vehicles/toyota.ts](../data/vehicles/toyota.ts).
- [ ] **Cabs and beds for the 4th, 2nd and 1st Gen** (`configs` in `toyota.ts`), to turn on the "Your truck" filter on those pages.
- [ ] **Product research**, by the process in [plan section 4](vehicle-pages-plan.md#4-product-research-process). Next: a sixth 3rd Gen seat cover, so `/vehicles/toyota/tacoma/seat-covers` gets published (it needs 6 products), then bed covers for the 3rd and 4th Gen. 3rd Gen headlights are paused (no candidate met the rating bar).
- [ ] **Privacy contact address.** Set `CONTACT_EMAIL` in [app/privacy/page.tsx](../app/privacy/page.tsx); the email line appears on its own ([REVIEW.md](../REVIEW.md), manual step 1).

## Scheduled checks

- [ ] **Around 2026-11-27: four-week check on the redesign** (the brief's "How we'll measure success"). GA4 Explore: `affiliate_click` by Link type and Product type, `vehicle_fit_selected` by Fit method, `vehicle_year_selected` count. Search Console: impressions and position for the 5 Tacoma URLs. Supabase: the clicks-by-ASIN query in the brief. The custom dimensions were registered 2026-10-30, so GA4 data starts then.
- [ ] **Late November: re-run the corrected clicks query** in [plan section 9](vehicle-pages-plan.md#9-first-party-data-to-pull). The first run counted bot traffic from before the 2026-10-20 filter.
- [ ] **8-week expansion gate** ([plan 2.3](vehicle-pages-plan.md#23-gate-to-expand-8-weeks-after-launch)): check at 4 weeks, decide at 8. Counting from the redesign launch on 2026-10-30, the decision is around 2026-12-25.

## Code

- [ ] **Amazon data on the cards:** image, price with time, stock, and the Sort control. Needs its own brief once the `amazon_items` cache table is designed ([plan 6.4](vehicle-pages-plan.md#64-supabase-later-the-amazon-data-cache) and [8.3](vehicle-pages-plan.md#83-build-steps)). The Creators API needs 10 qualifying sales in 30 days first.
- [ ] **Photo pipeline demand logging** uses a hardcoded confidence cutoff of 85 ([lib/pipeline.ts](../lib/pipeline.ts)) instead of the shared thresholds ([REVIEW.md](../REVIEW.md), M7 leftovers).
- [ ] **Unused preview branch** in [components/home/results-display.tsx](../components/home/results-display.tsx) (`variant="preview"`, hardcodes Tacoma links). Deleting it hasn't been approved yet ([REVIEW.md](../REVIEW.md), N10).
- [ ] **Major-version dependency upgrades** were skipped in the October audit ([REVIEW.md](../REVIEW.md), L11).
- [ ] **Product-type page layout:** it got the new cards and the "Your truck" filter in Step 2, but still has the old dark hero and disclosure band. Restyle it when the first one goes live.

## Done recently

- 2026-10-30: Search Console indexing requested for the 5 Tacoma URLs and the 5 pages Google didn't seem to know (`/truck-bed-covers`, `/blog`, `/vehicles`, `/vehicles/toyota`, `/blog/running-boards-buying-guide`).
- 2026-10-30: Vercel Firewall rate-limit rule added for the analysis endpoints ([REVIEW.md](../REVIEW.md), manual step 2).
- 2026-10-30: Vehicle pages redesign, all three steps: generation page layout (#32), "Your truck" fit filter (#33), model hub (#34). The hub ships without the comparison table until the facts above are in.
- 2026-10-30: GA4 custom dimensions registered for `product_type`, `cab`, `bed`, `page`, `year`, `generation`, `platform` and `entry_door` (`link_type` and `method` were already there).
