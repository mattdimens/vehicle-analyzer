# VisualFitment.com: Codebase Audit

Date: October 11, 2026. Read-only audit of `main` at `b96835e` (no commits since August 4). No source code was changed. This replaces the August 4, 2026 audit, which is still in git history (`git show ba90031:REVIEW.md`).

**Method:** I read every server-side file, every API route, and every file on the affiliate, analytics, auth/save, and upload paths. I spot-checked the rest of the UI. I ran `tsc --noEmit`, `eslint`, `next build`, `npm audit --omit=dev` and `npm outdated`.

**Not re-verified this time:** I did not probe the live Supabase project. Reading `.env.local` was blocked, and I did not ask for the keys. The August audit's empirical RLS result (anon reads return 0 rows on every table) stands, but it is now two months old. Four items below are marked **(verify)** because they depend on database or bucket configuration that is not in the repo.

---

## 1. Executive Summary

The August fix pass held up well. The toast system is mounted. Year ranges no longer break "Save to My Garage". Every Amazon link now goes through `/go` with `nofollow sponsored noopener`. FAQ schema and visible FAQ text come from one source. The wasted image-quality Gemini call is gone. Uploads are downscaled before they are sent. Typecheck and build are clean.

Four problems now matter most:

1. **The installed Next.js version has published critical advisories.** Next 16.0.7 is affected by 12+ GitHub advisories, including Server Actions source-code exposure and a CSRF bypass of Server Actions. This app depends on Server Actions. The fix is a minor bump to 16.4.0.
2. **Gemini cost abuse is only half closed.** URL validation landed, but there is still no rate limiting anywhere. Two public Server Actions also accept raw base64 image data, which skips the URL check completely. Anyone can use them as a free Gemini Flash/Pro proxy on your bill.
3. **The privacy policy is factually wrong.** It describes "anonymous" analytics from a hosting provider and says only essential cookies are set. The site actually runs Google Analytics 4 and sets a one-year `vf_sid` affiliate-tracking cookie. Both Google Analytics' terms and the Amazon Associates agreement require accurate disclosure. The deletion-request contact is still "coming soon".
4. **The "Analyze a photo" buttons do nothing on the homepage.** Every CTA that targets `#upload-zone` (header CTA, mobile menu, the selector's "Analyze My Photo Instead" fallback, blog CTAs, vehicle-page CTAs, educational guides, garage empty state) points at an element the homepage never renders. On the homepage the header button calls `preventDefault()` and then finds nothing to scroll to. The selector fallback is shown to every non-Tacoma visitor, which is most selector users, and it is a dead button.

**Fix first, in order:** (1) `npm i next@16.4.0 eslint-config-next@16.4.0` plus `npm audit fix`; (2) add rate limiting and remove the `inlineData` passthrough from public actions; (3) rewrite the privacy policy; (4) add `id="upload-zone"` to the homepage photo panel.

---

## 1a. Fix Pass (branch `audit-fixes-2026-10`, October 11, 2026)

**Checks after the pass:** `tsc` and `next build` (Next 16.4.0) are clean. Lint is at 101 problems (from 111). `npm audit --omit=dev` shows only 4 moderate advisories, all in build-time `gray-matter`. I smoke-tested on `npm run dev`: homepage CTAs, the selector fallback on `/` and `/r/[id]`, blog fonts and hero, vehicle-page JSON-LD, sitemap, the CSP header, and URL rejection on `/api/analyze` and `/api/analyses`. No live Gemini analyses were run.

| Finding | Status |
|---|---|
| N1 | **Fixed.** Next 16.4.0, `npm audit fix` |
| N2 | **Fixed in code.** The Gemini stages moved to server-only `lib/analysis-stages.ts`. Public actions accept validated URLs only, prompt inputs are sanitized, product types are capped at 8, and `/process` has a 10 s cooldown and a 24 h max age. **Still needed:** a Vercel WAF rate-limit rule (see below). |
| N3 | **Mostly fixed.** The policy is rewritten (GA4, `vf_sid`, Gemini paid tier, Supabase, Amazon, storage). There is no privacy contact address yet: while `CONTACT_EMAIL` ([app/privacy/page.tsx:10](app/privacy/page.tsx:10)) is empty, the page points to in-app deletion in My Garage and says a contact address is coming. Set it as soon as you have one. |
| N4 | **Fixed.** `id="upload-zone"` is on the hero photo panel, and the selector fallback navigates to `/#upload-zone` when the tool isn't on the page |
| N5 | **Fixed.** Vehicle pages emit a plain `ItemList` of names, with no `Product`/`Offer` |
| N6 | **Fixed.** A failed sniper parse keeps the scout result |
| N7 | **Fixed in code.** The extension comes from the MIME type. **Still needed:** bucket MIME and size limits. |
| N8 | **Fixed.** One shared browser client; `lib/supabase.ts` and `@supabase/ssr` removed |
| N9 | **Fixed.** The schema keeps `vehicle_present`, `confidence_score`, alt text, `yearRange`, and `trim`; category pages show a "no vehicle" error |
| N10 | **Corrected:** the `>= 90` labels sat in `results-display.tsx`'s `variant="preview"` branch, which no caller uses. The live view shows raw percentages. Labels and part colors now use `getConfidenceBand()` anyway (part `medium` cutoff moved from 50 to 55, so `part_identification_completed` outcomes shift slightly). The dead preview branch (which also hardcodes Tacoma links) is still there; deleting it was not approved in this pass. |
| N11 | **Fixed.** Heroes went from 3.5/4.9 MB PNGs to 290/430 KB JPGs with `fetchPriority="high"`; blog fonts moved to `next/font`. The homepage sample card was loading the same 4.9 MB PNG from Supabase and now uses local `/images/sample-result.jpg` (L3). |
| N12 | **Fixed.** The pipeline and routes stamp `updated_at` on every write |
| N13 | **Fixed.** `/r` reports completion only for runs it watched, including retries. Category pages fire `analysis_completed` with a new `entry_point` param. |
| N14 | **Fixed.** The products update is write-once, has a 15 min window, and is schema-validated. PATCH only narrows the AI's own year range. |
| N15 | **Fixed.** `/api/analyze` logs with the service-role client |
| N16 | Open (planned refactor: one server endpoint for the category flow) |
| **New: selector logging was broken** | Found during the smoke test: `vehicle_selector_events` rejects anon inserts (RLS 42501), so `/api/log-vehicle-selector` has logged nothing. **Fixed:** it now uses the service-role client and validates input. |
| **New: CSP blocked GA4 Google Signals** | `stats.g.doubleclick.net` was blocked. **Fixed:** `img-src`/`connect-src` now follow Google's GA4 CSP list (also closes M9). Google Fonts hosts were removed. |
| M1 | **Fixed (Oct 11, follow-up PR).** `types/supabase.ts` is now generated from the live schema with `supabase gen types`. Regenerating found three real bugs, all fixed in the same PR: (1) the pipeline's `logDemand` inserted a nonexistent `generation` column and no required `year`/`supported`, so photo-analysis demand was never logged; (2) `identified_parts.vehicle_year` is an integer, so saving a part whose estimated vehicle began with a year range failed; (3) `identified_parts.confidence` is text, so the garage now coerces it before comparing. |
| New (open) | `identified_parts` has a `notes` column the app never uses. The garage's "Notes & Description" editor overwrites the AI's `description` instead. |
| M2 | Partly: the fitment prompt now lives only in `lib/analysis-stages.ts` |
| M3, M4, M8, L5 README | Fixed (dead files and assets deleted, `.env.example`, README) |
| L2 | **Corrected:** `lib/env.ts`, `lint_output.txt`, and `test-db.js` were never in `.gitignore` (that line in my first draft came from `git ls-files` output). They are now deleted. |
| L3 (footer, breadcrumbs), L4, L5, L6, L7, L9, Aug L2 (IDs) | Fixed |
| Still open | N16, M7 leftovers, M10, M11, L1, L8 (selector `sessionId`: no client-readable session id exists), L11 |

**Your manual steps:**
1. When you have a privacy address, set `CONTACT_EMAIL` in `app/privacy/page.tsx`; the email line appears automatically.
2. In Vercel → Firewall, add a rate-limit rule: for example, 20 requests per minute per IP on paths starting `/api/analy`, plus a rule on POST requests with a `Next-Action` header.
3. In Supabase → Storage → `vehicle_images`, restrict allowed MIME types to `image/jpeg, image/png, image/gif, image/webp` and set a file size limit (about 5 MB).
4. Commit your RLS policies and migrations (types are now generated; rerun the command at the top of `types/supabase.ts` after schema changes).

---

## 2. Status of the August 2026 Findings

| ID | Finding | Status |
|---|---|---|
| C1 | Open analysis endpoints / SSRF | **Partly fixed.** SSRF is closed via `lib/url-validation.ts`. Rate limiting was never added, and a new bypass exists (see N2). |
| C2 | Year-range save failure | Fixed (`lib/normalize-year.ts`, used in both save paths) |
| C3 | Toaster not mounted | Fixed ([app/layout.tsx:126](app/layout.tsx:126)) |
| H1 | Garage Amazon links bypass `/go` | Fixed; `lib/amazon.ts` deleted |
| H2 | FAQ text vs schema drift | Fixed (single exported array per page) |
| H3 | Missing funnel events | Mostly fixed. Category-page vehicle analyses still fire no completion event (N13). |
| H4 | `/go` silent logging failure / no session | Fixed (loud `console.error`, `vf_sid` cookie). `user_id` is still never written. |
| H5 | Missing `noopener` | Fixed |
| H6 | Discarded quality-check call | Fixed (removed) |
| H7 | Fitment not schema-validated | Fixed, but the schema now strips needed fields (N9) |
| H8 | Image cost multiplication | Mostly fixed. Downscaling is in, `codeExecution` is gone, and the sniper is skipped on the Unknown fallback. Category flow still re-downloads every image once per Gemini call (N16). |
| H9 | Pipeline timeouts | `/api/analyze` now has `maxDuration = 60`; pipeline limit unchanged |
| M1 | Stale DB types | **Open** ([types/supabase.ts](types/supabase.ts) still lacks `affiliate_clicks`, `profiles`, and real `vehicle_selector_events` columns) |
| M2 | Duplicated prompt / logic | **Open** (prompt still duplicated at [app/actions.ts:52](app/actions.ts:52) and [app/api/analyze/route.ts:86](app/api/analyze/route.ts:86); `parseRecommendation` x3; 3 browser Supabase clients, now a bug: N8) |
| M3 | Dead code | **Open** (`lib/env.ts`, `lib/supabase.ts`, `components/home/stats-bar.tsx`, `test-db.js`, unrun `test/`, shadowing re-import at [app/actions.ts:30](app/actions.ts:30) and [:47](app/actions.ts:47)) |
| M4 | Unused images in `public/` | **Open** (about 1.9 MB) |
| M5 | Broken links / phantom schema URLs | Schema URLs fixed. Footer `/#use-cases` is still dead (L3). |
| M6 | `/my-garage` indexable | Fixed |
| M7 | Confidence thresholds disagree | **Open, and now a visible bug** (N10) |
| M8 | Tag defined twice / no `.env.example` | Tag fixed; `.env.example` still missing |
| M9 | CSP `img-src` misses regional GA | **Open** ([next.config.ts:30](next.config.ts:30)). The Aug 4 "GA4 update" commit changed `connect-src` only. |
| M10 | Reporting table gaps / migrations | **Open** |
| M11 | `/blog` dynamic | **Open** (still `ƒ /blog`) |
| L1 | Lint failures | **Open** (111 problems, 55 errors) |
| L2 | `Math.random` IDs | **Open** ([app/api/analyses/route.ts:8](app/api/analyses/route.ts:8)) |
| L3 | Sample image from Supabase | **Open** |
| L4 | Middle-click tracking | Fixed |
| L5 | README boilerplate etc. | **Open** |

---

## 3. Findings by Severity

### CRITICAL

#### N1. Next.js 16.0.7 has published critical advisories, including Server Actions exposure

- **Files:** [package.json](package.json) (`next ^16.0.7`, lockfile pins 16.0.7)
- **Impact:** `npm audit` reports `next` (critical) affected by 12+ advisories. Several directly hit this app's architecture: Server Actions source-code exposure (GHSA-w37m-7fhw-fmv9), a `null` origin bypassing the Server Actions CSRF check (GHSA-mq59-m269-xvcx), and several Server Components DoS issues. The site exposes five Server Actions to the browser. Other flagged packages: `protobufjs` (critical, via `@google/genai`), `ws`, `sharp` (bundled libvips/libheif CVEs), `source-map-js`, `yaml` (high/moderate).
- **Fix:** `npm i next@16.4.0 eslint-config-next@16.4.0`, then `npm audit fix`. Rebuild and smoke-test the upload and `/go` paths. 16.4.0 is in the same major, so this is low risk.

#### N2. No rate limiting anywhere, and two public Server Actions skip URL validation entirely

- **Files:** [app/actions.ts:29-40](app/actions.ts:29) (`resolveImageParts` passes any `{ inlineData }` object straight to Gemini), [:210](app/actions.ts:210) `detectVisibleProducts`, [:258](app/actions.ts:258) `refineProductDetails`; no `middleware.ts`/`proxy.ts` exists; [app/api/analyses/[id]/process/route.ts](app/api/analyses/[id]/process/route.ts)
- **Impact:** `detectVisibleProducts` and `refineProductDetails` are imported by a client component ([components/home/vehicle-analyzer.tsx:6-15](components/home/vehicle-analyzer.tsx:6)), so they are public endpoints. Their `imageInputs: ImageInput[]` parameter accepts base64 `inlineData` objects, which bypass `assertSupabaseStorageUrl` completely. `productType` and `vehicleDetails` go into the prompt without sanitization. A script can send any image plus arbitrary prompt text and get Flash output back, escalated to the Pro model whenever confidence is 85 or below. Separately, nothing limits `/api/analyses`, `/api/analyze`, `identifyPart`, or `/api/analyses/{id}/process`. The last one re-runs the whole multi-call pipeline on any errored record, as many times as it is called.
- **Fix:** (a) Change the exported actions to accept `string[]` URLs only and validate them. Keep the `inlineData` path for internal pipeline use through a non-exported helper in `lib/`. (b) Add IP-based limits: a Vercel WAF rate-limit rule on `/api/*` and on POSTs carrying the `Next-Action` header is the zero-code option, or use Upstash Ratelimit in `middleware.ts`. (c) Cap retries per analysis ID in `/process`.

### HIGH

#### N3. The privacy policy misdescribes analytics and cookies, and has no deletion contact

- **Files:** [app/privacy/page.tsx:46](app/privacy/page.tsx:46), [:70](app/privacy/page.tsx:70), [:25-26](app/privacy/page.tsx:25); [app/layout.tsx:96-110](app/layout.tsx:96) (GA4), [app/go/route.ts:7-8](app/go/route.ts:7) and [:90-97](app/go/route.ts:90) (`vf_sid`, one year)
- **Impact:** The policy says analytics come from "a third-party hosting provider" and are "anonymous", and that "the only cookies we set are essential ones". In fact the site loads Google Analytics 4, which sets `_ga`/`_ga_*` cookies, and sets a one-year `vf_sid` cookie whose only purpose is joining affiliate clicks into sessions. Google Analytics terms require disclosing GA use. The Amazon Associates Operating Agreement requires disclosing that third parties may set cookies. The deletion section has said "coming soon" since March. "Last updated: March 1, 2026" predates both changes. The images bucket is public-read, but the policy calls it "secure cloud storage". The "not used for model training" claim is only true on a paid Gemini API tier **(verify** your billing tier in Google AI Studio).
- **Fix:** Name Google Analytics, Google Gemini, Supabase, and Amazon. List the cookies (`_ga*`, `vf_sid`, the Supabase auth token in localStorage). Give a real contact email for deletion requests, and update the date.

#### N4. "Analyze a photo" CTAs are dead on the homepage

- **Files:** [components/ui/site-header.tsx:52-62](components/ui/site-header.tsx:52), [components/home/vehicle-selector.tsx:112-117](components/home/vehicle-selector.tsx:112) and [:207-215](components/home/vehicle-selector.tsx:207), [components/home/vehicle-analyzer.tsx:524-525](components/home/vehicle-analyzer.tsx:524) (the only `id="upload-zone"`, rendered only when `!showCategories`, so never on the homepage); targets in `app/vehicles/**`, `app/blog/[slug]/page.tsx:216`, `components/educational/*`, `components/garage/garage-dashboard.tsx:332`
- **Impact:** On the homepage, the header CTA calls `preventDefault()` and then `getElementById('upload-zone')`, which returns `null`, so the click does nothing. The vehicle selector's "Analyze My Photo Instead" button does the same in all three places it appears: the hero, the results-correction view, and the `/r` error state. It shows for every vehicle except the Tacoma. On mobile the photo panel sits above the selector, so the user taps and nothing visible happens. Cross-page links to `/#upload-zone` from the blog, vehicle pages, guides, and garage land at the top of the homepage rather than at the tool. That is tolerable because the hero is at the top, but it is not what the link promises.
- **Fix:** Add `id="upload-zone"` (with `scroll-mt-20`) to the photo-tool panel in [components/home/hero-dual-entry.tsx:161](components/home/hero-dual-entry.tsx:161). On `/r/[id]`, make the fallback button a link to `/#upload-zone`.

#### N5. Product/Offer structured data on vehicle pages is invalid and misrepresents you as a seller

- **Files:** [app/vehicles/[make]/[model]/[generation]/page.tsx:141-153](app/vehicles/[make]/[model]/[generation]/page.tsx:141), [app/vehicles/[make]/[model]/page.tsx:150-152](app/vehicles/[make]/[model]/page.tsx:150)
- **Impact:** Each catalog product is emitted as `Product` with an `Offer` that has no `price`/`priceCurrency`, is marked `InStock`, and has a URL pointing at `/go`. `/go` is disallowed in `robots.txt` and redirects to an Amazon search page. Google requires `price` on `Offer`, so these produce "Invalid item" errors in Search Console. Claiming in-stock offers for products you don't sell risks a structured-data manual action. Your vehicle pages are your main SEO surface, so this is where it hurts most.
- **Fix:** Drop the `offers` block and keep `ItemList` → `Product` (name, description, brand) only, or emit an `ItemList` of plain names. Check the result in the Rich Results Test.

### MEDIUM

#### N6. A malformed Pro (sniper) response throws away a valid Flash (scout) result

- **Files:** [app/actions.ts:308](app/actions.ts:308) (`refineProductDetails`), [:390](app/actions.ts:390) (`identifyPart`); also [:287](app/actions.ts:287) and [:377](app/actions.ts:377)
- **Impact:** The sniper's `JSON.parse` is not wrapped in its own try/catch. If the Pro model returns non-JSON, it throws to the outer catch. The product becomes "Error during product refinement", or the whole part identification fails, even though a schema-valid scout answer was already in hand. Scout parse failures surface a raw `SyntaxError` message to the user. The comments say "keeping Scout result", but the code doesn't.
- **Fix:** Wrap each sniper `JSON.parse` in try/catch and fall through to the scout result, as `/api/analyze` already does at lines 180-192.

#### N7. Signed-upload action trusts the client's filename extension and declared MIME type (verify bucket config)

- **Files:** [app/actions.ts:122-153](app/actions.ts:122)
- **Impact:** The extension comes from `fileName.split('.').pop()`, and the MIME check is against a client-declared string. A caller can request `uuid.html` with type `image/png`, then PUT any body and content type to the signed URL. Unless the `vehicle_images` bucket restricts MIME types and size, that makes your public bucket free file or phishing hosting under your Supabase domain. It is not XSS on visualfitment.com, but it is your project's reputation and egress.
- **Fix:** Derive the extension from the validated MIME (`image/jpeg` → `jpg`). **(verify)** In Supabase → Storage → `vehicle_images`, set allowed MIME types to the four image types and a file size limit (about 5 MB is ample after downscaling).

#### N8. Two independent Supabase auth clients run in the browser

- **Files:** [components/auth-provider.tsx:12-14](components/auth-provider.tsx:12) (own `createClient`), [lib/supabase-client.ts](lib/supabase-client.ts) (used by the save hook and every garage component)
- **Impact:** Both clients use the same localStorage key and both auto-refresh tokens. Supabase warns "Multiple GoTrueClient instances detected" because the two can race on refresh-token rotation, which shows up as random sign-outs ("Invalid Refresh Token: Already Used"). The provider's `onAuthStateChange` also doesn't see refreshes done by the other client.
- **Fix:** Have `auth-provider.tsx` import `supabaseClient` from `lib/supabase-client.ts`, and delete the unused `lib/supabase.ts`.

#### N9. Fitment schema strips `vehicle_present`, and category pages have no "no vehicle" state

- **Files:** [lib/schemas.ts:16-34](lib/schemas.ts:16), [app/api/analyze/route.ts:196-205](app/api/analyze/route.ts:196)
- **Impact:** Zod drops unknown keys, so `parseResult.data` loses `vehicle_present`, `confidence_score`, and `seo_optimized_alt_text`. The `otherPossibilities` transform also drops `yearRange` and `trim`. The homepage pipeline stores the raw object, so `/r/[id]` is unaffected. On `/truck-bed-covers`, `/wheels-rims`, and `/nerf-bars-running-boards`, a photo with no vehicle still renders a full fitment card for a hallucinated vehicle, and the `analysis_results` rows lose those fields.
- **Fix:** Add `vehicle_present`, `confidence_score`, and `seo_optimized_alt_text` as optional fields and keep `yearRange`/`trim` (or use `.passthrough()`). Render the same "we don't see a vehicle" state the `/r` page has.

#### N10. Low-confidence results are labeled "Medium Confidence" on category pages

- **Files:** [components/home/results-display.tsx:277](components/home/results-display.tsx:277), [:362](components/home/results-display.tsx:362), [:64](components/home/results-display.tsx:64), [:108-113](components/home/results-display.tsx:108); [config/analysis.ts](config/analysis.ts)
- **Impact:** The label is `confidence >= 90 ? "High" : "Medium"`, so a 20% identification reads "Medium Confidence". That undermines trust on exactly the results most likely to be wrong. Part identification uses a fourth band set (80/50). `/r` uses 80/55 from config.
- **Fix:** Use `getConfidenceBand()` from [types/analysis.ts:91](types/analysis.ts:91) everywhere.

#### N11. Blog hero images are 3.5 MB and 4.9 MB PNGs served through raw `<img>`

- **Files:** `public/blog/images/truck-trim-levels-explained-hero.png` (4.9 MB), `leveling-kit-vs-lift-kit-hero.png` (3.5 MB); [app/blog/[slug]/page.tsx:280](app/blog/[slug]/page.tsx:280)
- **Impact:** The above-the-fold hero is the LCP element. Five megabytes unoptimized on mobile will fail Core Web Vitals for those two posts. The other heroes are 100-240 KB JPGs. The blog layout also loads Google Fonts through a render-blocking external stylesheet ([app/blog/layout.tsx:25](app/blog/layout.tsx:25)) rather than `next/font`.
- **Fix:** Re-export both as roughly 1600 px JPG/WebP under 250 KB, or switch the hero to `next/image` with `priority`. Move DM Sans / DM Serif Display to `next/font/google`.

#### N12. Stale-analysis logic depends on a database trigger that isn't in the repo (verify)

- **Files:** [app/api/analyses/[id]/route.ts:33-53](app/api/analyses/[id]/route.ts:33), [app/api/analyses/[id]/process/route.ts:28-34](app/api/analyses/[id]/process/route.ts:28), [lib/pipeline.ts](lib/pipeline.ts) (no update writes `updated_at`)
- **Impact:** The two-minute "timed out" check reads `updated_at`, but no code sets it. Without an `ON UPDATE` trigger, `updated_at` stays at creation time. Then a "Try again" on an analysis older than two minutes gets marked "Analysis timed out" by the next poll while the retry is still running.
- **Fix:** **(verify)** Confirm a `moddatetime`/`updated_at` trigger exists on `analyses`. If not, set `updated_at: new Date().toISOString()` in each pipeline update. Commit migrations so this is auditable.

#### N13. Analytics: completion events are double-counted on `/r` and missing on category pages

- **Files:** [components/analysis/analysis-view.tsx:50-89](components/analysis/analysis-view.tsx:50), [components/home/vehicle-analyzer.tsx:484](components/home/vehicle-analyzer.tsx:484)
- **Impact:** `analysis_completed` fires on every page load of a finished `/r/{id}`, so revisits and shared links count as new completions and inflate the completion rate. After a failed analysis and a successful "Try again", the success never fires because the ref is already set. On category pages, vehicle analyses fire `photo_analysis_started` but never a completion event, so started→completed can't be computed there. Homepage `photo_analysis_started` fires before the upload, so upload failures count as starts.
- **Fix:** Fire completion only when the view observed an in-progress status first, and reset the ref on retry. Add a completion event at the end of `processItem` in vehicle mode.

#### N14. Anyone can rewrite analysis records

- **Files:** [app/actions.ts:427-466](app/actions.ts:427) (`updateAnalysisResultsProducts`, public action, service-role key), [app/api/analyses/[id]/route.ts:58-103](app/api/analyses/[id]/route.ts:58) (`PATCH` with no auth)
- **Impact:** `updateAnalysisResultsProducts` overwrites `detectedProducts` on any `analysis_results` row matched by `image_url`, and image URLs are returned by the public `/api/analyses/{id}`. `PATCH` lets anyone with a result link change its year. The impact is low (internal logging data, unindexed pages), but it is a write path with no ownership check.
- **Fix:** Do the products update server-side inside `/api/analyze`, or key it by a row ID returned only to the caller, and stop exporting it as an action. Accept the PATCH risk or tie it to a short-lived token returned at creation.

#### N15. `/api/analyze` logs with the anon key (verify)

- **Files:** [app/api/analyze/route.ts:22-31](app/api/analyze/route.ts:22), [:214-221](app/api/analyze/route.ts:214)
- **Impact:** Every other server write uses the service-role key, but this route inserts into `analysis_results` as `anon`. If RLS denies anon INSERT, which is likely given that anon SELECT returns nothing, every category-page analysis silently goes unlogged, and `updateAnalysisResultsProducts` then finds no row.
- **Fix:** **(verify)** Check for recent rows with `model_used` set and no `detectedProducts` from category flows, or just switch this route to `getSupabaseAdmin()` like the pipeline.

#### N16. Category flow re-downloads every image for every Gemini call

- **Files:** [components/home/vehicle-analyzer.tsx:427](components/home/vehicle-analyzer.tsx:427), [:434](components/home/vehicle-analyzer.tsx:434); [app/actions.ts:219](app/actions.ts:219), [:265](app/actions.ts:265)
- **Impact:** The pipeline fetches images once. The category flow passes URLs, so `/api/analyze` plus `detectVisibleProducts` plus N × `refineProductDetails` each re-fetch and re-encode all images (up to 10) from Supabase. This adds egress and latency, not tokens.
- **Fix:** Move the category flow onto a single server endpoint that fetches once, like `runPipeline`. That also removes the need for N2's public actions.

### LOW

- **L1. Lint:** 111 problems (55 errors). `npm run lint` still fails, so it can't gate CI.
- **L2. Untracked-but-ignored files:** `lib/env.ts`, `lint_output.txt`, and `test-db.js` are listed in `.gitignore` but are still tracked by git, so the ignore entries do nothing. `git rm --cached` them, or delete them; `lib/env.ts` is dead anyway.
- **L3. Dead anchors:** footer `/#use-cases` (UseCases renders only on sub-pages, [vehicle-analyzer.tsx:630](components/home/vehicle-analyzer.tsx:630)); category breadcrumb schema `/#categories` (no such id, [app/truck-bed-covers/page.tsx:33](app/truck-bed-covers/page.tsx:33) and siblings).
- **L4. EXIF location data:** downscaling strips EXIF only when the image is resized. Photos at or under 1568 px are uploaded as-is to a public bucket, GPS tags included. Always re-encode, or strip metadata.
- **L5. Upload decode failures are silent on category pages:** `handleFilesSelect` awaits `Promise.all(downscaleImage)` with no catch ([vehicle-analyzer.tsx:114](components/home/vehicle-analyzer.tsx:114)). The camera input's `accept="image/*"` ([upload-zone.tsx:267](components/home/upload-zone.tsx:267), [:381](components/home/upload-zone.tsx:381)) lets through formats the browser can't decode (for example HEIC in desktop Chrome), and then nothing happens. The homepage hero says "Maximum 10 files" but uses only the first one.
- **L6. Nested `<main>`:** the root layout's `<main>` wraps page-level `<main>` elements in `vehicle-analyzer.tsx:508`, `app/r/[id]/page.tsx:15`, and `app/privacy/page.tsx:11`. Change the inner ones to `<div>`/`<section>`.
- **L7. Entry-door attribution:** homepage landings never set a door, so a visitor who lands on `/`, reads a blog post, and then clicks an affiliate link is attributed to `blog`. Set `direct_or_other` explicitly on first page view.
- **L8. Selector logging:** `/api/log-vehicle-selector` accepts `sessionId`, but the selector never sends it ([vehicle-selector.tsx:88-97](components/home/vehicle-selector.tsx:88)). The pipeline's `logDemand` writes a different row shape (no year/supported).
- **L9. Sitemap `lastModified`:** every static and vehicle page reports the build date ([app/sitemap.ts:8](app/sitemap.ts:8)), which teaches Google to ignore your lastmod.
- **L10. Unused prompt hardening:** `analyzeVehicleFitment` interpolates raw `promptContext` ([app/actions.ts:49](app/actions.ts:49)), while `/api/analyze` sanitizes it. The action is server-only today, so this is not exploitable, but the copies have drifted (see M2).
- **L11. Dependencies:** `@supabase/supabase-js` 2.81 → 2.117, `@google/genai` 1.42 → 1.52 (2.x available), `baseline-browser-mapping` still prints a staleness warning on every build.
- **L12. Content freshness:** all 7 blog posts are dated March 7-13, 2026, so nothing has been published in seven months. This is not a code defect, but `sitemap.ts` marks `/blog` as `daily`.

---

## 4. GA4 Event Inventory (current)

| Event | Trigger | File |
|---|---|---|
| `photo_analysis_started` | Homepage submit (before upload); category/part "Start" | [hero-dual-entry.tsx:93](components/home/hero-dual-entry.tsx:93), [vehicle-analyzer.tsx:484](components/home/vehicle-analyzer.tsx:484) |
| `analysis_completed` | `/r/{id}` terminal state, on **every** view (N13) | [analysis-view.tsx:83](components/analysis/analysis-view.tsx:83), [:87](components/analysis/analysis-view.tsx:87) |
| `part_identification_completed` | Part result renders | [results-display.tsx:65](components/home/results-display.tsx:65) |
| `ymm_selector_submitted` | Selector submit | [vehicle-selector.tsx:81](components/home/vehicle-selector.tsx:81) |
| `browse_by_vehicle_click` | Homepage generation card | [browse-by-vehicle.tsx:24](components/home/browse-by-vehicle.tsx:24) |
| `save_to_garage` / `save_part` | Successful insert (direct or post-sign-in) | [save-to-garage-button.tsx:22](components/save-to-garage-button.tsx:22), [save-to-parts-button.tsx:21](components/save-to-parts-button.tsx:21), [auth-provider.tsx:78](components/auth-provider.tsx:78), [:100](components/auth-provider.tsx:100) |
| `affiliate_click` | Click or middle-click on any `/go?` link | [analytics-tracker.tsx:24](components/analytics-tracker.tsx:24) |

Missing: category-page vehicle `analysis_completed` (N13). There is still no Meta, TikTok, or other pixel; GA4 is the only tracker.

---

## 5. Build & Tooling Snapshot

- `tsc --noEmit`: clean
- `next build` (16.0.7, Turbopack): clean, 31 routes; `/blog` and `/go` dynamic, everything else static/SSG
- `eslint`: 111 problems (55 errors, 56 warnings)
- `npm audit --omit=dev`: 14 vulnerabilities (2 critical, 8 high, 4 moderate); all fixable without major bumps

## 6. Suggested Fix Batches

1. **Security (half a day):** N1 upgrade; N2 action signatures plus a WAF rate limit; N7 extension and bucket limits; N14.
2. **Conversion and trust (1-2 hours):** N4 anchor id; N10 confidence bands; N9 no-vehicle state on category pages.
3. **Compliance (1 hour plus your review):** N3 privacy policy rewrite.
4. **SEO and performance (1-2 hours):** N5 schema; N11 hero images and fonts; L3, L9.
5. **Correctness and data (half a day):** N6, N8, N12, N13, N15, N16; regenerate types (M1); commit migrations (M10).
6. **Cleanup:** M2-M4, L1, L2, L5-L8, README and `.env.example`.

*No source files were modified by this audit; only REVIEW.md was rewritten.*
