# VisualFitment.com — Full Codebase Audit

Date: August 4, 2026. Read-only audit of the repository on the `main` branch. No code was changed. This replaces the July 6, 2026 audit (a backup of that file was saved to the session scratchpad).

Verification method: every source file was read; `next build` and `eslint` were run; row-level security was probed empirically against the live Supabase project using read-only queries with both the anonymous key and the service key (no data was written or modified).

---

## 1. Executive Summary

The site builds cleanly, the Gemini models have been correctly migrated to the new versions, none of the removed API parameters are in use anywhere, and the anonymous-access test against the live database confirmed that row-level security is blocking public reads on every table, including the ones holding user garages. Those three previously flagged issues are in good shape. The affiliate redirect layer itself is sound: every link on the public pages goes through `/go`, the redirect can only ever send people to Amazon, and 1,631 clicks have been logged to date. However, three things need attention soon. First, the photo-analysis machinery is still open to the whole internet with no sign-in and no rate limits, and one of the two analysis endpoints will fetch any web address a caller supplies, which means a stranger or a bot could run up your Gemini bill or probe your infrastructure. Second, the "Save to My Garage" feature fails silently whenever the AI returns a year range like "2021-2024" (the database column only accepts a single number), and because the toast notification system was never actually mounted in the app, the user sees no error, no confirmation, and no feedback of any kind anywhere on the site; every toast message in the codebase is currently invisible. Third, the two Amazon buttons inside the My Garage detail panels bypass the `/go` layer entirely, so those clicks are never logged, never counted in analytics, and use a hardcoded affiliate tag. On the analytics side, GA4 is wired up correctly, but several key funnel steps (saving to garage, photo analyses started from category pages, part identifications) fire no events at all. The rest of the findings are waste and polish: a discarded image-quality AI call that costs money on every category-page analysis, duplicated prompt logic, dead code including an environment-validation module that never runs, about 1.9 MB of unused images, and FAQ text on the three category pages that has already drifted out of sync with its schema markup.

**The three most important fixes, in order: (1) lock down or rate-limit the analysis endpoints, (2) mount the toast component and fix the year-range save failure, (3) route the garage Amazon buttons through `/go`.**

---

## 2. Findings by Severity

### CRITICAL

#### C1. Analysis endpoints are open to the internet, and one accepts arbitrary URLs (cost abuse + SSRF)

- **Files:** [app/api/analyses/route.ts:11-36](app/api/analyses/route.ts:11), [lib/pipeline.ts:29-79](lib/pipeline.ts:29), [lib/gemini.ts:34-43](lib/gemini.ts:34), [app/api/analyze/route.ts:37](app/api/analyze/route.ts:37), [app/actions.ts:25-103](app/actions.ts:25)
- **Impact:** `POST /api/analyses` accepts any `imageUrl` string with no validation and no authentication, then the server fetches that URL (`fetchImageForGemini`) and feeds it to Gemini. A caller can point it at internal or third-party addresses (server-side request forgery) or simply loop it to burn your Gemini budget and Vercel compute. The sibling endpoint `/api/analyze` does validate that URLs come from your Supabase storage (good), but it, the signed-upload action, and all five Gemini-calling server actions in `app/actions.ts` are callable by anyone with no rate limits or quotas. This was flagged in the July audit and remains open. A single script could generate thousands of paid AI calls per hour.
- **Recommended fix:** In `/api/analyses`, reuse the same origin check `/api/analyze` already has (reject any `imageUrl` not starting with your `NEXT_PUBLIC_SUPABASE_URL`). Then add IP-based rate limiting (Vercel WAF rules or an Upstash limiter) across `/api/analyses`, `/api/analyze`, and the server actions, with a small anonymous per-hour cap.

#### C2. "Save to My Garage" silently fails whenever the AI returns a year range

- **Files:** [components/save-to-garage-button.tsx:24-35](components/save-to-garage-button.tsx:24), [hooks/use-save-to-supabase.ts:40-52](hooks/use-save-to-supabase.ts:40), [types/supabase.ts:119](types/supabase.ts:119) (`garage_vehicles.year` is a number), [components/auth-provider.tsx:52-66](components/auth-provider.tsx:52)
- **Impact:** The AI frequently returns `year` as a range string like `"2021-2024"` (the prompt explicitly asks it to). The save button passes that string straight into `garage_vehicles.year`, which is an integer column, so Postgres rejects the insert. The error is caught and shown via `toast.error(...)` — which is invisible (see C3) — so the user clicks "Save to My Garage," nothing happens, and the vehicle is never saved. The same failure occurs in the post-sign-in pending-save path in the auth provider. This quietly breaks a core retention feature for exactly the analyses where the AI was less than fully certain, which is a large share of real uploads.
- **Recommended fix:** Before saving, normalize the year: if it is a range, store the first year (or prompt the user to pick one via the existing year-refinement UI), and change the insert to send a real number. Longer term, consider making the column text or adding a `year_range` column so no information is lost.

#### C3. The toast notification system is never mounted, so every success and error message in the app is invisible

- **Files:** [components/ui/sonner.tsx](components/ui/sonner.tsx) (Toaster component exists but is imported nowhere), [app/layout.tsx:77-125](app/layout.tsx:77) (no `<Toaster />`), plus ~15 `toast(...)` call sites in [components/auth-provider.tsx](components/auth-provider.tsx), [hooks/use-save-to-supabase.ts](hooks/use-save-to-supabase.ts), [components/garage/vehicle-card.tsx](components/garage/vehicle-card.tsx), [components/garage/part-card.tsx](components/garage/part-card.tsx), [components/garage/vehicle-detail-sheet.tsx](components/garage/vehicle-detail-sheet.tsx), [components/garage/part-detail-sheet.tsx](components/garage/part-detail-sheet.tsx)
- **Impact:** The sonner library's `<Toaster />` component must be rendered once (normally in the root layout) for any `toast()` call to display. It never is. Every confirmation ("Vehicle saved to your garage!", "Part deleted successfully") and every error ("Failed to save vehicle. Please try again.") is silently dropped. Users get zero feedback on saves, deletes, edits, and sign-in-to-save flows, and failures like C2 are completely masked.
- **Recommended fix:** Render `<Toaster />` from `components/ui/sonner.tsx` once inside the root layout's body. One-line change; verify a save and a delete visibly confirm afterward.

### HIGH

#### H1. My Garage Amazon buttons bypass the `/go` money path entirely

- **Files:** [components/garage/part-detail-sheet.tsx:280-283](components/garage/part-detail-sheet.tsx:280), [components/garage/vehicle-detail-sheet.tsx:222-226](components/garage/vehicle-detail-sheet.tsx:222), [lib/amazon.ts:7](lib/amazon.ts:7)
- **Impact:** These two buttons build `https://www.amazon.com/s?k=...` URLs directly with `addAmazonAffiliateTag`, which hardcodes the tag `visualfitment-20` and ignores the `AMAZON_ASSOCIATE_TAG` environment variable. Because they skip `/go`: (a) the click is never written to `affiliate_clicks`, (b) the GA4 `affiliate_click` event never fires (the tracker only watches `/go?` links), and (c) the links use `rel="noopener noreferrer"` instead of the required `nofollow sponsored`. Your most engaged users (people who saved items) are the ones whose purchase intent you are not measuring. A "share" text in the part sheet ([part-detail-sheet.tsx:34](components/garage/part-detail-sheet.tsx:34)) also embeds a raw untagged Amazon URL.
- **Recommended fix:** Replace both hrefs with `/go?...` URLs (a `merchant=amazon` + `product`/`vehicle` query using the existing builder), which restores logging, analytics, and correct rel attributes in one step, and delete `lib/amazon.ts` once nothing uses it.

#### H2. FAQ text and FAQPage schema have already drifted apart on all three category pages

- **Files:** [app/truck-bed-covers/page.tsx:53-63](app/truck-bed-covers/page.tsx:53) (schema) vs [app/truck-bed-covers/vehicle-analyzer-client.tsx:48-70](app/truck-bed-covers/vehicle-analyzer-client.tsx:48) (visible text); same dual-source pattern in [app/wheels-rims/page.tsx](app/wheels-rims/page.tsx) + client, [app/nerf-bars-running-boards/page.tsx](app/nerf-bars-running-boards/page.tsx) + client
- **Impact:** Each category page defines its FAQ answers twice: once as JSON-LD in the server page and once as the visible accordion in the client component. They are already different (for example, the visible bed-liner answer begins "Absolutely. Most tonneau covers…" while the schema version says "Most tonneau covers are designed…"; the measuring answer includes "(the wall behind the cab)" only in the visible copy). Google treats mismatched FAQ markup as spammy structured data and can drop rich results or issue a manual action. The blog does this correctly — visible FAQ and schema both come from the same MDX frontmatter ([app/blog/[slug]/page.tsx:186-200](app/blog/[slug]/page.tsx:186) and [:338-348](app/blog/[slug]/page.tsx:338)) and cannot drift.
- **Recommended fix:** Define each category page's FAQ list once (a single exported array per page), and generate both the JSON-LD and the `FaqAccordion` items from it, mirroring the blog approach.

#### H3. Key conversion steps fire no analytics events

- **Files:** [components/home/vehicle-analyzer.tsx:495-516](components/home/vehicle-analyzer.tsx:495) (category-page/part-identifier analyses: no events), [components/save-to-garage-button.tsx](components/save-to-garage-button.tsx) / [components/save-to-parts-button.tsx](components/save-to-parts-button.tsx) (no save event), [lib/analytics.ts:17](lib/analytics.ts:17) (`blog` entry door defined but never set anywhere)
- **Impact:** The funnel has holes you cannot see in GA4: photo analyses started on `/truck-bed-covers`, `/wheels-rims`, `/nerf-bars-running-boards`, and `/part-identifier` produce zero events (only the homepage hero fires `photo_analysis_started`); "Save to My Garage" and "Save Part" — the clearest retention signals on the site — fire nothing; part identifications have no completion event; and visitors who arrive via blog posts can never be attributed to the `blog` entry door because `setEntryDoor('blog')` is never called. Combined with H1, both ends of the funnel (entry attribution and monetized exits from the garage) are under-measured.
- **Recommended fix:** Fire `photo_analysis_started` (with `entry_point`) in `handleStartBatch`, add `save_to_garage` / `save_part` events in the two save buttons, add a completion event for part mode, and call `setEntryDoor('blog')` from a small client effect in the blog layout.

#### H4. `/go` click logging can silently switch off, and never records who clicked

- **Files:** [app/go/route.ts:34-57](app/go/route.ts:34), [lib/supabase-server.ts:5-16](lib/supabase-server.ts:5)
- **Impact:** If `SUPABASE_SERVICE_ROLE_KEY` is ever missing or rotated incorrectly in Vercel, `logClick` returns early and every redirect proceeds unlogged — revenue clicks vanish from your data with no alert (the fallback client is even built with a `"dummy_key_to_prevent_crash_at_build"`). Separately, the `affiliate_clicks` table has `user_id` and `session_id` columns (confirmed against the live schema) that the route never populates, so you cannot join clicks to users or sessions for attribution.
- **Recommended fix:** Log loudly (or send to an error tracker) when the key is missing rather than skipping silently; add a health check that compares GA `affiliate_click` counts with `affiliate_clicks` rows. Pass a session identifier (and user id when signed in) into the `/go` URL or a cookie, and write them in the insert.

#### H5. Seven affiliate links are missing `noopener` (brand rule: `nofollow sponsored noopener`)

- **Files:** [components/home/results-display.tsx:188](components/home/results-display.tsx:188), [:607](components/home/results-display.tsx:607), [:674](components/home/results-display.tsx:674), [:723](components/home/results-display.tsx:723); [components/analysis/analysis-results-view.tsx:173](components/analysis/analysis-results-view.tsx:173), [:238](components/analysis/analysis-results-view.tsx:238), [:275](components/analysis/analysis-results-view.tsx:275)
- **Impact:** All seven use `target="_blank"` with `rel="nofollow sponsored"` only. Without `noopener`, the destination page gets a `window.opener` handle to your tab (modern browsers mitigate this, but the stated brand rule requires it explicitly). The two vehicle-catalog components ([product-card.tsx:62](components/vehicles/product-card.tsx:62), [popular-picks.tsx:68](components/vehicles/popular-picks.tsx:68)) already do it correctly, and the two garage links in H1 are missing `nofollow sponsored` altogether.
- **Recommended fix:** Change all seven to `rel="nofollow sponsored noopener"`; fold the garage links into the H1 fix.

#### H6. A paid Gemini image-quality check runs on every category-page analysis and its result is thrown away

- **Files:** [components/home/vehicle-analyzer.tsx:386-392](components/home/vehicle-analyzer.tsx:386) (issues stored, never shown), [:106](components/home/vehicle-analyzer.tsx:106) and [:647-655](components/home/vehicle-analyzer.tsx:647) (`QualityWarningDialog` is rendered but `setCurrentQualityItem` is never called with a value, so it can never open), [app/actions.ts:372-410](app/actions.ts:372) (`checkImageQuality`)
- **Impact:** Every analysis on the sub-pages makes a full Gemini Flash call (with all uploaded images attached) to assess photo quality, then stores the result in `qualityIssues`, which no component renders, and the warning dialog that was built for it is unreachable. You pay for one extra vision call per analysis and the user gains nothing.
- **Recommended fix:** Either surface the result (open the existing dialog when `isHighQuality` is false) or remove the `checkImageQuality` step and dialog entirely. Removing it is the cheapest option; the pipeline's `vehicle_present` flag already covers the "no vehicle in photo" case.

#### H7. The primary fitment result is never schema-validated before it reaches the database and the UI

- **Files:** [app/api/analyze/route.ts:142-153](app/api/analyze/route.ts:142) (JSON.parse only), [app/actions.ts:80-99](app/actions.ts:80) (same), [lib/pipeline.ts:39-50](lib/pipeline.ts:39) (blind cast to `AnalysisResults`)
- **Impact:** The product-detection and part-identification paths validate Gemini's output with Zod, but the main vehicle-fitment response — the one users see first — is only `JSON.parse`d. Valid JSON with a missing or reshaped `primary` object flows straight into `analysis_results`/`analyses` and the UI. The pipeline then reads `result.primary.year` and crashes into its catch block (analysis shows a generic error); on `/api/analyze` the malformed blob is returned to the client and stored. The sniper-fallback silently keeps a bad scout result if the sniper output fails to parse ([app/actions.ts:94-97](app/actions.ts:94)), which is reasonable, but there is no final shape check.
- **Recommended fix:** Run the parsed object through the existing `AnalysisResultsSchema` (already defined in [app/actions.ts:192-210](app/actions.ts:192)) in both call sites, and return a clean "AI returned an unexpected format, please retry" error when it fails instead of persisting the blob.

#### H8. Gemini spend is multiplied by re-downloading full-size images for every call, and the sniper re-fires on unidentifiable products

- **Files:** [lib/gemini.ts:34-43](lib/gemini.ts:34) (fresh fetch + base64 per call), [components/home/vehicle-analyzer.tsx:311-338](components/home/vehicle-analyzer.tsx:311) (uploads original files, up to 10 files x 10 MB, no resize), [app/actions.ts:315-348](app/actions.ts:315) (scout returns the "Unknown/confidence 50" fallback, which is ≤ the 85 threshold, so the sniper always fires for products that simply are not identifiable), [app/api/analyze/route.ts:124-138](app/api/analyze/route.ts:124) and [:177-179](app/api/analyze/route.ts:177) plus [app/actions.ts:74-78](app/actions.ts:74) (a `codeExecution` tool is enabled on vision calls that only need JSON out)
- **Impact:** One category-page analysis with several detected products can produce roughly 8-14 Gemini calls (quality check, fitment scout + possible sniper, product detection, then scout + possible sniper per product type), and each call re-downloads every image from Supabase and re-sends the full-resolution base64 payload, inflating token costs, Supabase egress, and latency. Enabling code execution on these calls adds cost/latency and increases the chance of non-JSON output for no benefit. The "Unknown brand, confidence 50" fallback guarantees a paid Pro-model retry on exactly the products least likely to benefit.
- **Recommended fix:** Resize/compress images client-side before upload (e.g., cap the long edge at ~1568 px, JPEG ~80%); fetch and encode each image once per analysis and pass the parts to every stage; drop the `codeExecution` tool; and skip the sniper retry when the scout's answer is the hardcoded Unknown fallback rather than a genuine low-confidence identification.

#### H9. The background pipeline can outlive its 60-second budget, producing "Analysis timed out" errors

- **Files:** [app/api/analyses/route.ts:5](app/api/analyses/route.ts:5) (`maxDuration = 60`), [lib/pipeline.ts:29-79](lib/pipeline.ts:29) (fitment + detection + N refinements inside `waitUntil`), [app/api/analyses/[id]/route.ts:33-53](app/api/analyses/[id]/route.ts:33) (2-minute stale fallback), [app/api/analyze/route.ts](app/api/analyze/route.ts) (no `maxDuration` at all — scout + sniper sequential calls can exceed the platform default)
- **Impact:** The homepage flow runs the entire multi-call pipeline inside `waitUntil` on a function capped at 60 seconds. A busy photo (many product types, sniper escalations, big images) can exceed that; the function is killed mid-flight, the record sticks in `identifying`/`detecting_products`, and the user eventually sees "Analysis timed out. Please retry." The category-page flow's `/api/analyze` route exports no `maxDuration`, so two sequential model calls run under the default limit and can 504 under load.
- **Recommended fix:** Raise `maxDuration` on the analyses routes (and add one to `/api/analyze`), and reduce per-call latency via the H8 image work. If timeouts persist, split the pipeline into resumable steps (the `status` column already supports this).

### MEDIUM

#### M1. Generated database types are stale and hide schema mismatches

- **Files:** [types/supabase.ts](types/supabase.ts) — missing the `affiliate_clicks` and `profiles` tables entirely; `vehicle_selector_events` lacks the real `year`, `supported`, and `session_id` columns (confirmed against the live database); [app/go/route.ts:38-47](app/go/route.ts:38) works around it with `as any`
- **Impact:** The compiler cannot catch typos or drift on your revenue-logging insert, and future edits to `/go` or the selector logging can break silently.
- **Recommended fix:** Regenerate types with the Supabase CLI (`supabase gen types typescript`) and remove the `as any`/`number | string` hacks that were patched around the stale file.

#### M2. The 40-line Gemini fitment prompt (and other logic) is duplicated

- **Files:** [app/actions.ts:35-72](app/actions.ts:35) vs [app/api/analyze/route.ts:84-121](app/api/analyze/route.ts:84) (identical prompt, already at risk: only one site would get future edits); `parseRecommendation` defined three times ([components/home/results-display.tsx:224](components/home/results-display.tsx:224), [components/analysis/analysis-results-view.tsx:21](components/analysis/analysis-results-view.tsx:21), [components/home/sample-result-preview.tsx:10](components/home/sample-result-preview.tsx:10)); query dedupe logic duplicated between [lib/affiliate/merchants.ts:13-19](lib/affiliate/merchants.ts:13) and [app/go/route.ts:28-31](app/go/route.ts:28); two large near-duplicate results renderers ([components/home/results-display.tsx](components/home/results-display.tsx), 755 lines, vs [components/analysis/analysis-results-view.tsx](components/analysis/analysis-results-view.tsx)); three different browser Supabase client factories ([components/auth-provider.tsx:12](components/auth-provider.tsx:12), [lib/supabase-client.ts](lib/supabase-client.ts), [lib/supabase.ts](lib/supabase.ts))
- **Impact:** Prompt tweaks, recommendation parsing changes, and auth/session fixes each have to be made in multiple places; missing one produces subtle inconsistencies between the homepage flow and the category-page flow.
- **Recommended fix:** Move the prompt into `lib/gemini.ts` as a builder function; export one `parseRecommendation`; make `/go` reuse the merchant builder's query; consolidate on a single browser client module; plan to converge the two results renderers on the newer `analysis-results-view`.

#### M3. Dead code, including an environment-validation module that never runs

- **Files:** [lib/env.ts](lib/env.ts) (imported nowhere — the Zod env validation it promises never executes, so a missing `NEXT_PUBLIC_GA_ID` or `GEMINI_API_KEY` fails silently at runtime instead of loudly at boot), [lib/supabase.ts](lib/supabase.ts) (`getBrowserClient` unused), [components/home/stats-bar.tsx](components/home/stats-bar.tsx) (unused), [components/home/quality-warning-dialog.tsx](components/home/quality-warning-dialog.tsx) (unreachable, see H6), [test-db.js](test-db.js) (debug script at repo root), [test/](test/analysis-fixture-test.ts) (two fixture tests wired to no npm script, never run), [app/actions.ts:30](app/actions.ts:30) (dynamic re-import that shadows the top-of-file imports for no effect)
- **Impact:** Dead paths mislead future work (the env module especially — it looks like validation exists) and inflate review surface.
- **Recommended fix:** Either import `publicEnv`/`getServerEnv` where the raw `process.env` reads are, or delete the module; delete the other dead files; add a `"test"` script if the fixture tests are meant to gate anything.

#### M4. ~1.9 MB of unreferenced images and template assets in `public/`

- **Files:** `public/images/sample-result-raptor.jpg` (1.1 MB, referenced nowhere), `public/images/sample-result-tacoma.jpg` (273 KB, referenced nowhere — the homepage sample card actually loads its image from Supabase storage per [data/sample-analysis.ts:5](data/sample-analysis.ts:5)), `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg` (create-next-app leftovers), `public/logo.png` (452 KB source for a 32 px header logo — next/image optimizes it, but the repo/deploy carries the full file)
- **Impact:** Deployment bloat and confusion; no runtime cost since nothing loads them.
- **Recommended fix:** Delete the unreferenced files; export a reasonably sized logo source.

#### M5. Broken and phantom internal links

- **Files:** [components/ui/site-footer.tsx:10-21](components/ui/site-footer.tsx:10) (`#how-it-works` and `#use-cases` are bare fragments that do nothing on every page except the homepage), [app/blog/[slug]/page.tsx:175-180](app/blog/[slug]/page.tsx:175) (breadcrumb schema points to `/blog/category/{slug}`, a route that does not exist), [:145](app/blog/[slug]/page.tsx:145) (author URL `https://visualfitment.com/about`, also nonexistent)
- **Impact:** Footer links appear dead on most of the site; schema URLs that 404 undermine the structured data's credibility with crawlers.
- **Recommended fix:** Prefix the footer fragments with `/` (`/#how-it-works`), and either create the category/about pages or remove those URLs from the schema.

#### M6. `/my-garage` is statically prerendered and indexable

- **Files:** [app/my-garage/page.tsx:3-6](app/my-garage/page.tsx:3) (no `robots` metadata; page appears as Static in the build output)
- **Impact:** A private dashboard shell can be indexed by search engines (only the empty logged-out shell, since data loads client-side, but it wastes crawl budget and looks broken in search results). `/r/[id]` handles this correctly with `robots: { index: false }`.
- **Recommended fix:** Add `robots: { index: false, follow: false }` to the page metadata.

#### M7. Confidence thresholds disagree across three modules

- **Files:** [config/analysis.ts:2-5](config/analysis.ts:2) (high = 80, medium = 55, used by `/r/[id]`), [lib/gemini.ts:8](lib/gemini.ts:8) (cascade threshold 85), [components/home/results-display.tsx:265](components/home/results-display.tsx:265) and [:350](components/home/results-display.tsx:350) (hardcoded `>= 90` for the "High Confidence" label in preview mode)
- **Impact:** The same 82%-confidence analysis is labeled "High" on `/r/[id]` but "Medium" in the preview renderer, and the escalation cutoff is a third number; product decisions about these bands are hard to reason about.
- **Recommended fix:** Route every band label and the cascade cutoff through `config/analysis.ts`.

#### M8. Affiliate tag defined twice; environment variables undocumented

- **Files:** [lib/affiliate/merchants.ts:21](lib/affiliate/merchants.ts:21) (`AMAZON_ASSOCIATE_TAG` env with `visualfitment-20` fallback), [lib/amazon.ts:7](lib/amazon.ts:7) (same tag hardcoded, no env); no `.env.example` documenting the six required variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AMAZON_ASSOCIATE_TAG`, `NEXT_PUBLIC_GA_ID`)
- **Impact:** Changing the tag in Vercel would update `/go` links but not the garage links (H1), splitting commissions across two tags; new environments get set up by guesswork.
- **Recommended fix:** Single source for the tag (the merchants registry), and add a committed `.env.example`.

#### M9. CSP allows GA's primary transport but not its image-beacon fallback

- **Files:** [next.config.ts:27-31](next.config.ts:27) — `script-src` and `connect-src` correctly include `googletagmanager.com` and `*.google-analytics.com` (regional endpoints covered by the wildcard), but `img-src` lists only `www.google-analytics.com`, not `*.google-analytics.com` or `www.googletagmanager.com`
- **Impact:** When GA falls back to image-pixel transport (older browsers, some beacon failures), hits to regional hosts like `region1.google-analytics.com` are blocked and those pageviews are lost. Small but real undercounting.
- **Recommended fix:** Broaden `img-src` to `https://*.google-analytics.com https://www.googletagmanager.com`.

#### M10. Reporting-table gaps that need a dashboard check

- **Files:** [app/go/route.ts:38](app/go/route.ts:38) (`affiliate_clicks` insert), [lib/pipeline.ts:14-27](lib/pipeline.ts:14) (writes `vehicle_selector_events` with no `year`/`supported`, while [app/api/log-vehicle-selector/route.ts:30-36](app/api/log-vehicle-selector/route.ts:30) requires them — two writers, two shapes)
- **Impact:** `affiliate_clicks` is at 1,631 rows and growing on every redirect; whether it has indexes on `created_at`/`merchant`/`category` cannot be verified from the repo (no migrations are committed). The selector-events table mixes two record shapes, which will complicate demand reporting.
- **Recommended fix:** Check indexes in the Supabase dashboard and add one on `created_at` (and any column you filter reports by); commit migrations to the repo going forward so the schema is auditable; unify the two selector-event writers.

#### M11. `/blog` index renders server-side on every request

- **Files:** [app/blog/page.tsx:29-39](app/blog/page.tsx:29) (reads `searchParams`, making the route dynamic — visible as `ƒ /blog` in the build output); [:13](app/blog/page.tsx:13) canonical is always `/blog` even on `?page=2+`
- **Impact:** Every blog-index view is a Vercel function invocation instead of a cached static page, and paginated pages canonicalize to page 1 (acceptable but worth being deliberate about).
- **Recommended fix:** If pagination traffic is trivial, render page 1 statically and link to a `/blog/page/2` static route; otherwise leave it and accept the invocation cost.

### LOW

#### L1. ESLint reports 114 problems (55 errors)

- **Files:** across the repo; representative: [hooks/use-media-query.ts:13](hooks/use-media-query.ts:13) (setState in effect), [lib/pipeline.ts:48](lib/pipeline.ts:48) (`any`), [test-db.js:1](test-db.js:1) (require imports), many unused vars in tests
- **Impact:** `npm run lint` fails, so lint cannot be used as a CI gate; the errors themselves are style/typing, not runtime bugs (build passes).
- **Recommended fix:** One `--fix` pass plus an hour of manual cleanup, then enforce lint in CI.

#### L2. Analysis IDs come from `Math.random`

- **Files:** [app/api/analyses/route.ts:7-9](app/api/analyses/route.ts:7)
- **Impact:** 8-character base-36 IDs from a non-cryptographic RNG. Result pages are public-by-link and unindexed, so exposure is limited to guessability of other people's (anonymous) results.
- **Recommended fix:** Use `crypto.randomUUID()` (or a nanoid) as elsewhere in the codebase.

#### L3. Homepage sample-result image loads from Supabase storage

- **Files:** [data/sample-analysis.ts:5](data/sample-analysis.ts:5)
- **Impact:** The above-the-fold sample card depends on your storage bucket for a static marketing image; if the bucket or that object changes, the homepage hero degrades.
- **Recommended fix:** Serve it from `public/images` (the unused `sample-result-tacoma.jpg` appears to have been intended for exactly this) and delete the storage dependency.

#### L4. Middle-clicks on affiliate links are not tracked

- **Files:** [components/analytics-tracker.tsx:8-38](components/analytics-tracker.tsx:8) (listens to `click` only; middle-click fires `auxclick`)
- **Impact:** Open-in-new-tab-via-middle-click affiliate clicks reach `/go` (so they are logged in Supabase) but fire no GA event — a small, systematic GA undercount versus the database.
- **Recommended fix:** Add an `auxclick` listener guarded to button 1.

#### L5. Assorted cleanup

- [README.md](README.md) is untouched create-next-app boilerplate — replace with setup notes and the env-var list (pairs with M8).
- `baseline-browser-mapping` prints a staleness warning on every build — `npm i baseline-browser-mapping@latest -D`.
- [components/home/hero-dual-entry.tsx:24-26](components/home/hero-dual-entry.tsx:24) declares a `HeroDualEntryProps` interface with an `onFilesSelect` prop the component never accepts.
- `next-themes` is used only inside the unmounted Toaster ([components/ui/sonner.tsx:10](components/ui/sonner.tsx:10)) and there is no `ThemeProvider`; when C3 is fixed, the theme will always resolve to "system" — fine, but the dependency exists solely for that line.
- Em-dash brand rule: **zero em dashes found** in any user-facing copy (checked all TSX, TS, and MDX byte-for-byte). FAQ copy does use en dashes in ranges ("6'4"–6'6"", "1–3%"), which the rule as stated permits.

---

## 3. Event Inventory Table

Every custom GA4 event currently fired in the codebase:

| Event name | Trigger | Parameters | File / line |
|---|---|---|---|
| `photo_analysis_started` | "Analyze My Photo" submit in the homepage hero (only there) | `platform` ('mobile'/'desktop'), `entry_point: 'homepage'` | [components/home/hero-dual-entry.tsx:93](components/home/hero-dual-entry.tsx:93) |
| `ymm_selector_submitted` | Year/Make/Model selector submit (hero, results-correction, degraded state) | `supported` (boolean), `location` ('hero' / 'results_correction' / 'degraded_state') | [components/home/vehicle-selector.tsx:81](components/home/vehicle-selector.tsx:81) |
| `browse_by_vehicle_click` | Click on a homepage "Browse by Vehicle" generation card | `generation` (label) | [components/home/browse-by-vehicle.tsx:24](components/home/browse-by-vehicle.tsx:24) |
| `analysis_completed` | `/r/[id]` reaches a terminal state (once per view, ref-guarded) | `outcome` ('error' / 'unusable' / 'partial' / 'high' / 'medium' / 'low'), `catalog_match` (boolean), `platform` | [components/analysis/analysis-view.tsx:83](components/analysis/analysis-view.tsx:83), [:87](components/analysis/analysis-view.tsx:87) |
| `affiliate_click` | Document-level click listener on any `<a>` whose href contains `/go?` | `entry_door`, `source_page` (normalized from the `source` param), `catalog_match` (only when source is vehicle_page) | [components/analytics-tracker.tsx:26](components/analytics-tracker.tsx:26) |

Event-health notes:

- **No event fires twice.** `analysis_completed` has two call sites but a ref guard and mutually exclusive paths.
- **No event fires with undefined parameters** (the tracker's optional `catalog_match` is conditionally spread).
- **Defined but never used:** the `blog` value of `EntryDoor` ([lib/analytics.ts:17](lib/analytics.ts:17)) — `setEntryDoor('blog')` is never called, so blog-first sessions report `direct_or_other`.
- **Funnel gaps (see H3):** no photo-upload/started event on the three category pages or the part identifier; no event for "Save to My Garage" or "Save Part"; no part-identification completion event; garage Amazon clicks fire nothing because they bypass `/go` (H1).
- **Other pixels:** none. No Meta, TikTok, or affiliate-network pixels exist in the codebase; GA4 is the only tracker, and there is no dead tracking script weight.

---

## 4. Verification Notes (the three known issues)

### Gemini models and removed parameters — **PASS**

- `SCOUT_MODEL = 'gemini-3.6-flash'` and `SNIPER_MODEL = 'gemini-3.1-pro-preview'`, defined once in [lib/gemini.ts:6-7](lib/gemini.ts:6) and imported everywhere else. The dead `gemini-3-pro-preview` string appears nowhere in the codebase.
- Removed parameters: **zero uses** of `temperature`, `top_p`/`topP`, `top_k`/`topK`, `candidate_count`/`candidateCount`, or `thinking_budget`/`thinkingBudget` anywhere (a raw-string sweep of all TS/TSX confirmed; the only near-matches were `stopPropagation` in UI code). `thinking_level` is not set either — all calls use API defaults, which is valid.
- Caveats worth knowing (not failures): a `codeExecution` tool is enabled on the scout/sniper fitment calls for no clear reason (H8), and the fitment response is not schema-validated (H7).

### GA4 fix — **PASS (with two caveats)**

- The env variable exists: `.env.local` contains a `NEXT_PUBLIC_GA_ID` with a `G-` value, and [app/layout.tsx:24](app/layout.tsx:24) reads it and conditionally injects the gtag loader + config on **all** pages via the root layout ([:95-110](app/layout.tsx:95)) — home, vehicle pages, blog, category pages, results, and garage all inherit it.
- CSP now permits GA: `script-src` includes `https://www.googletagmanager.com https://www.google-analytics.com`, and `connect-src` includes `https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com` ([next.config.ts:27-31](next.config.ts:27)) — the wildcard covers regional collection endpoints (`region1.google-analytics.com` etc.) for the primary fetch/beacon transport.
- Caveat 1: this repo cannot prove `NEXT_PUBLIC_GA_ID` is set in the **Vercel production** environment; if it is absent there, the tag silently does not render (and the env-validation module that would have caught it is dead code, M3). Verify once in the Vercel dashboard.
- Caveat 2: `img-src` does not cover regional GA hosts, so the rare image-beacon fallback is CSP-blocked (M9).

### Supabase RLS — **PASS for public exposure (empirically tested); policies themselves not auditable from the repo**

- Live read-only probe with the **anonymous key**: `profiles`, `garage_vehicles`, `identified_parts`, `analyses`, `analysis_results`, `affiliate_clicks`, and `vehicle_selector_events` all returned **0 rows** to anon.
- The same head-count queries with the service key show the tables are **not** empty: profiles 8, garage_vehicles 1, identified_parts 4, analyses 13, analysis_results 485, affiliate_clicks 1,631, vehicle_selector_events 7. Conclusion: RLS is enabled and blocking anonymous SELECT on every table — the previously flagged exposure is closed.
- The service-role key is used **only** in server-side code ([app/actions.ts:17-20](app/actions.ts:17) under `'use server'`, [lib/pipeline.ts:7-12](lib/pipeline.ts:7), [lib/supabase-server.ts](lib/supabase-server.ts), and the API routes) and is never referenced with a `NEXT_PUBLIC_` prefix, so it cannot leak into client bundles.
- Auth is Google-only as intended: the only sign-in path is `signInWithOAuth({ provider: 'google' })` ([components/auth-provider.tsx:121-129](components/auth-provider.tsx:121)); no password, magic-link, or other provider code exists.
- **Remaining gap:** no SQL migrations are committed, so the policy definitions (in particular whether *authenticated* users' SELECT/UPDATE/DELETE on `garage_vehicles` and `identified_parts` are scoped to `auth.uid()`) cannot be read from the repo, and testing them would require a second real user account. The client code adds `user_id` filters as defense-in-depth ([components/garage/garage-dashboard.tsx:66-75](components/garage/garage-dashboard.tsx:66), delete paths in vehicle/part cards), but the detail-sheet **updates** filter only by row id ([components/garage/vehicle-detail-sheet.tsx:49-52](components/garage/vehicle-detail-sheet.tsx:49), [components/garage/part-detail-sheet.tsx:51-54](components/garage/part-detail-sheet.tsx:51)) and rely entirely on RLS. Confirm in the Supabase dashboard that each user table has `USING (auth.uid() = user_id)` (and matching `WITH CHECK`) on SELECT/UPDATE/DELETE, and commit the policies as migration files so future audits can verify them from code. Session handling uses supabase-js in the browser (localStorage sessions) with no `@supabase/ssr` middleware — acceptable for this fully client-side garage, but it means server components can never know who is signed in; adopt the SSR cookie pattern if server-side personalization is ever needed.

---

*Audit complete. Build: clean (Next.js 16.0.7, 31 static pages, no errors or warnings beyond a stale `baseline-browser-mapping` notice). Lint: 114 problems (55 errors, 59 warnings), all style/typing. No files other than this one were modified.*
