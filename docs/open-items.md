# Open items

The one list of what's still to do on Visual Fitment: things waiting on Matt, scheduled checks, and code work. Claude updates it at the end of each session: tick off what got done (move it to "Done recently" with the date and PR), add anything new to its section, and re-rank "Priorities". Detail stays in the linked docs; each item here is one or two lines.

Last updated: 2026-10-30.

## Priorities

Every open item below, in the order to do it. Ranked by what moves the Tacoma pilot toward its 8-week gate ([plan 2.3](vehicle-pages-plan.md#23-gate-to-expand-8-weeks-after-launch)), then by risk, then by effort. Dated checks sit where their date falls.

| # | Item | Who | When | Why this rank |
|---|---|---|---|---|
| 1 | Privacy contact address | Matt | Now (5 min) | The privacy policy still says a contact address is coming. Google Analytics' terms and the Amazon Associates agreement require accurate privacy disclosure ([REVIEW.md](../REVIEW.md), N3), so it's a small fix with real risk. |
| 2 | Request indexing for the three Tacoma product-type pages: `/vehicles/toyota/tacoma/seat-covers`, `/floor-mats` and `/running-boards` | Matt | Now for seat covers; the other two once [#52](https://github.com/mattdimens/vehicle-analyzer/pull/52) merges | Product-type pages are what the gate depends on. |
| 3 | Cabs and beds for the 4th and 2nd Gen | Matt | Now that both have picks | The fit filter only works on a generation with configs. The 1st Gen can wait: it has no picks. |
| 4 | Light theme rollout: review and merge Step 1 ([#53](https://github.com/mattdimens/vehicle-analyzer/pull/53)), then Steps 2 to 4 | Matt and Claude | Now | In progress. Brand consistency rather than a gate mover, but each PR waits on the one before it, and it touches the homepage hero, so finish it before starting other homepage work. |
| 5 | Four-week check on the redesign, plus re-running the corrected clicks query | Matt and Claude | Around 2026-11-27 | First real read on whether picks get clicked, and the first with Amazon prices on the cards. Run both together. |
| 6 | Amazon cache follow-ups: Sort control and a weekly unavailable-listings report | Claude | When convenient | Prices are live, so Sort can show now. The report catches dead listings before visitors do. |
| 7 | ESLint 10 and TypeScript 7 | Claude | Recheck in December | Held back from the October upgrades until the lint plugins support them (see Code). Nothing breaks while we wait. |
| 8 | Tacoma generation facts for the hub table | Matt | When convenient | Adds useful content to the hub, but the hub works without it. |
| 9 | 8-week expansion gate | Matt and Claude | Around 2026-12-25 | Decides whether to expand to Gladiator, 4Runner and Bronco. |
| 10 | Rule call: allow a 2-pick section for 1st Gen floor mats | Matt | When convenient | The 1st Gen has 200/mo searches and no picks. Two sets pass; the minimum is three. |

## Waiting on Matt

- [ ] **Request indexing** for `/vehicles/toyota/tacoma/seat-covers` (live since 2026-10-30), and for `/floor-mats` and `/running-boards` under the same path once [#52](https://github.com/mattdimens/vehicle-analyzer/pull/52) merges.
- [ ] **Tacoma generation facts** for the hub's "How the generations differ" table: cabs, beds, engines, what carries over, for each generation. A row only shows when all four generations have it. Current values and TODOs: `specs` in [data/vehicles/toyota.ts](../data/vehicles/toyota.ts).
- [ ] **Cabs and beds for the 4th and 2nd Gen** (`configs` in `toyota.ts`), to turn on the "Your truck" filter on those pages. The 1st Gen can wait until it has picks.
- [ ] **Rule call on 2-pick sections.** 1st Gen floor mats have two passing sets (COTAZA B0FGY1T67N and DrCarNow B0FXWFJYZB, Regular Cab and Xtracab), one short of the 3-pick minimum. Allowing 2 picks would add them.
- [ ] **Privacy contact address.** Set `CONTACT_EMAIL` in [app/privacy/page.tsx](../app/privacy/page.tsx); the email line appears on its own ([REVIEW.md](../REVIEW.md), manual step 1).

## Scheduled checks

- [ ] **Four weeks after light theme Steps 1 and 2 ship:** re-pull the brief's measures. Homepage analysis start rate (baselines: 24% for Aug 15 to Oct 14, plus Oct 26 to the Step 1 ship date), `browse_by_vehicle_click` per homepage session, `vehicle_year_selected` by `page`, and the share of `/vehicles/toyota` sessions that reach a generation page.
- [ ] **Around 2026-11-27: four-week check on the redesign** (the brief's "How we'll measure success"). GA4 Explore: `affiliate_click` by Link type and Product type, `vehicle_fit_selected` by Fit method, `vehicle_year_selected` count. Search Console: impressions and position for the 5 Tacoma URLs. Supabase: the clicks-by-ASIN query in the brief. The custom dimensions were registered 2026-10-30, so GA4 data starts then.
- [ ] **Late November: re-run the corrected clicks query** in [plan section 9](vehicle-pages-plan.md#9-first-party-data-to-pull). The first run counted bot traffic from before the 2026-10-20 filter.
- [ ] **8-week expansion gate** ([plan 2.3](vehicle-pages-plan.md#23-gate-to-expand-8-weeks-after-launch)): check at 4 weeks, decide at 8. Counting from the redesign launch on 2026-10-30, the decision is around 2026-12-25.

## Code

- [ ] **Light theme rollout** (brief: `vf-light-theme-rollout-brief-oct-2026.md`, four PRs in order, each merged and live before the next). Step 1 is [#53](https://github.com/mattdimens/vehicle-analyzer/pull/53). Calls Matt approved on 2026-10-30:
  - The brand green in the code is mostly `#003223`, plus `#002A1C` and `#2A6B42`. Step 4's re-check searches for those as well as the brief's two values.
  - Orange text: `#C8460F` on white cards, `#9A3412` directly on the page background (`#C8460F` is 4.33:1 on `#EEF3F6`).
  - Step 2: the hub link sends `browse_by_vehicle_click` with `generation: "all"`. "Go" with no year chosen fires nothing, since it only jumps to the cards.
  - Steps 2 and 3: hide the year picker's "Not sure? Identify it from a photo" link on the homepage and make page. Keep it on the hub.
  - Step 4 covers /part-identifier and category heroes, `/vehicles`, `/my-garage`, the blog colors, and removing the temporary dark `tone` on the sample card pieces.
- [ ] **Product research**, resumed by Matt on 2026-10-30. Process: [plan section 4](vehicle-pages-plan.md#4-product-research-process), with the 2026-10-30 rule calls in section 4.3 (newer-vehicle bar, product-line record, the high-volume rule read in Matt's signed-in Chrome, no lift kits, no bed covers or RealTruck brands). Live: 3rd and 4th Gen seat covers, and floor mats and running boards for the 2nd, 3rd and 4th Gen. Paused for the 3rd Gen because too few Amazon listings pass: bed racks, bumpers and skid plates, wheels, roof racks, headlights. 2nd Gen seat covers are paused (one set passes). The 1st Gen is paused across the board: two floor mat sets pass (COTAZA B0FGY1T67N and DrCarNow B0FXWFJYZB, Regular Cab and Xtracab), one short of the 3-pick minimum, and no running boards or seat covers reach the rating bar. Tacoma research is done until listings change or Matt makes a rule call on 2-pick sections.
- [ ] **Amazon cache follow-ups:** the Sort control (now that prices show) and a weekly report of listings unavailable for 3 or more days ([plan 8.3](vehicle-pages-plan.md#83-build-steps), step 5). The cache refreshes daily at 10:00 UTC; Vercel's Hobby plan allows one cron run a day, so prices drop out for an hour or two each day.
- [ ] **ESLint 10 and TypeScript 7**, held back. ESLint 10 runs, but `eslint-config-next`'s import, jsx-a11y and react plugins don't support it yet. TypeScript 7 builds, but `typescript-eslint` 8 can't lint with it. Retry each once its plugins support it.

## Done recently

- 2026-10-30: Research PRs merged: 4th Gen seat covers, which publishes `/vehicles/toyota/tacoma/seat-covers` ([#45](https://github.com/mattdimens/vehicle-analyzer/pull/45)); 3rd Gen floor mats ([#47](https://github.com/mattdimens/vehicle-analyzer/pull/47)); 3rd Gen running boards ([#48](https://github.com/mattdimens/vehicle-analyzer/pull/48)); and the fix that shows the normal card for items the Creators API hides ([#46](https://github.com/mattdimens/vehicle-analyzer/pull/46)).
- 2026-10-30: Amazon price, image and stock on the vehicle cards, from an `amazon_items` cache refreshed daily ([PR #44](https://github.com/mattdimens/vehicle-analyzer/pull/44)). Production migration, `CRON_SECRET` and the first fill done; the Carhartt covers showed $272.97. #44 also added the RealTruck rule to plan 4.3 (no bed covers, no RealTruck-owned brands).
- 2026-10-30: Research paused by Matt after the 3rd Gen pass. Matt's rule calls are recorded in plan 4.3.
- 2026-10-30: Research resumed and merged: 4th Gen floor mats and running boards ([#50](https://github.com/mattdimens/vehicle-analyzer/pull/50)), 2nd Gen floor mats and running boards ([#51](https://github.com/mattdimens/vehicle-analyzer/pull/51)). 1st Gen scanned and paused.
- 2026-10-30: Floor mats and running boards guides, which publish `/vehicles/toyota/tacoma/floor-mats` and `/vehicles/toyota/tacoma/running-boards` ([#52](https://github.com/mattdimens/vehicle-analyzer/pull/52)).
- 2026-10-30: Major-version upgrades: Lucide 1, react-dropzone 20, `@types/node` 22 and the Gemini SDK 2. Matt tested a vehicle and a part photo on the preview ([PR #40](https://github.com/mattdimens/vehicle-analyzer/pull/40)).
- 2026-10-30: Product-type page on the light layout, with one shared guides list ([PR #38](https://github.com/mattdimens/vehicle-analyzer/pull/38)).
- 2026-10-30: Dependency updates within ranges, React 19.3, and the zod advisory fix; `npm audit` is clean ([PR #39](https://github.com/mattdimens/vehicle-analyzer/pull/39)).
- 2026-10-30: Demand logging uses the shared High band (80 or more) instead of a hardcoded 85 ([PR #41](https://github.com/mattdimens/vehicle-analyzer/pull/41)).
- 2026-10-30: The unused `variant="preview"` branch in `results-display.tsx` turned out to have been deleted on 2026-10-11 ([PR #5](https://github.com/mattdimens/vehicle-analyzer/pull/5)). `REVIEW.md` N10 still said it was there, and is corrected.
- 2026-10-30: Search Console indexing requested for the 5 Tacoma URLs and the 5 pages Google didn't seem to know (`/truck-bed-covers`, `/blog`, `/vehicles`, `/vehicles/toyota`, `/blog/running-boards-buying-guide`).
- 2026-10-30: Vercel Firewall rate-limit rule added for the analysis endpoints ([REVIEW.md](../REVIEW.md), manual step 2).
- 2026-10-30: Vehicle pages redesign, all three steps: generation page layout (#32), "Your truck" fit filter (#33), model hub (#34). The hub ships without the comparison table until the facts above are in.
- 2026-10-30: GA4 custom dimensions registered for `product_type`, `cab`, `bed`, `page`, `year`, `generation`, `platform` and `entry_door` (`link_type` and `method` were already there).
