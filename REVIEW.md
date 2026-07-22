# VisualFitment.com — Codebase & UX Audit

Date: July 6, 2026. Read-only review of the repository as it exists on the `main` branch. No code was changed.

---

## Executive Summary

The good news first: the product's core plumbing is in better shape than most early-stage sites. Every affiliate link on the public site routes through the /go redirect with click logging, the redirect cannot be hijacked to send users to arbitrary sites, the SEO fundamentals (sitemap, robots.txt, page titles, structured data on the blog and vehicle pages) are largely done correctly, no passwords or keys were ever committed to the code history, and the mobile "parking lot" upload flow is genuinely well designed. The single most important thing to fix is that the photo-analysis machinery is wide open to the internet: anyone (including bots) can call it without signing in and without limits, which means a stranger could silently run up your Google Gemini AI bill and fill your image storage. Closely behind that, the database's row-level security rules cannot be verified from the code, so we cannot currently prove that one user's garage is hidden from another user, and this must be checked in the Supabase dashboard. There is also a legal-compliance gap: the FTC-required affiliate disclosure is missing from the exact screens where the Amazon buy buttons appear. Overall risk level: **moderate-to-high**, driven by cost-abuse exposure and unverified database rules rather than by any evidence of an actual breach. All of the fixes below are targeted and small; nothing requires a rebuild.

---

## CRITICAL

### C1. Anyone on the internet can run up your AI bill (no sign-in, no limits)

- **Files:** [app/api/analyze/route.ts:37](app/api/analyze/route.ts:37), [app/actions.ts:26](app/actions.ts:26) (`createSignedUploadUrl`), [app/actions.ts:157](app/actions.ts:157), [app/actions.ts:207](app/actions.ts:207), [app/actions.ts:288](app/actions.ts:288), [app/actions.ts:353](app/actions.ts:353)
- **What's wrong:** The analysis endpoint and all five server actions (upload URL creation, product detection, product refinement, quality check, part identification) can be called by anyone, with no login required, no rate limiting, and no per-user quota. Several of them can trigger the expensive Gemini "Pro" model. The upload action also hands out unlimited storage upload permissions using your most powerful key (the service role key).
- **Why it matters:** A single script could send thousands of requests per hour. You would pay for every Gemini call and every gigabyte of storage. This is the cheapest way for someone to hurt the business without ever "hacking" anything.
- **Recommended fix:** Add rate limiting keyed to IP address (e.g., Vercel WAF rules or an Upstash Redis rate limiter) on `/api/analyze` and each server action in `app/actions.ts`; cap anonymous users at a small number of analyses per hour. Optionally require sign-in after N free analyses. A developer can do this in a day.

### C2. Uploaded photos can collide and overwrite each other

- **Files:** [app/actions.ts:38-42](app/actions.ts:38) (`createSignedUploadUrl` with `upsert: true`), [components/home/vehicle-analyzer.tsx:310](components/home/vehicle-analyzer.tsx:310)
- **What's wrong:** The storage path for an uploaded photo is exactly the file's original name (e.g., `IMG_1234.jpg`), and "upsert" is turned on, meaning a new upload with the same name silently replaces the old file. Phone cameras reuse names constantly, so two different users uploading `IMG_1234.jpg` will overwrite each other, and a malicious visitor could deliberately overwrite any file whose name they can guess. Analysis records in the database are then looked up by that same image URL ([app/actions.ts:436-441](app/actions.ts:436)), so results can get attached to the wrong photo — and `updateAnalysisResultsProducts` ([app/actions.ts:430](app/actions.ts:430)) lets any caller modify the most recent analysis record for any image URL they name.
- **Why it matters:** Users can see wrong or corrupted results (trust), and an attacker can tamper with stored images and analysis data (security).
- **Recommended fix:** Generate the storage filename on the server (a random UUID plus extension), turn off `upsert`, and have the analysis-update function work by record ID returned to the same session instead of by image URL.

### C3. The server can be tricked into fetching attacker-chosen web addresses (SSRF)

- **Files:** [app/actions.ts:360](app/actions.ts:360) (`identifyPart`), [app/actions.ts:166](app/actions.ts:166), [app/actions.ts:214](app/actions.ts:214), [app/actions.ts:295](app/actions.ts:295), and the weak check at [app/api/analyze/route.ts:63](app/api/analyze/route.ts:63)
- **What's wrong:** The server actions download whatever image URL the caller provides, with no check at all that it points to your own storage. The one place that does check (`/api/analyze`) uses `url.startsWith(supabaseOrigin)`, which is bypassable: a URL like `https://YOURPROJECT.supabase.co.attacker.com/x.jpg` passes the test because the text merely *starts with* your domain.
- **Why it matters:** This is a classic vulnerability class called server-side request forgery. Your server can be used to probe other systems, fetch attacker content, and feed arbitrary data into your AI pipeline on your dime.
- **Recommended fix:** In one shared helper, parse the URL with `new URL(...)` and require that `url.origin` exactly equals your Supabase URL and the path starts with `/storage/v1/object/public/vehicle_images/`. Use that helper in `/api/analyze` and in every server action that fetches an image.

---

## HIGH

### H1. Database row-level security (RLS) cannot be verified — must be audited in Supabase

- **Files:** No SQL/policy files exist anywhere in the repository; relevant behavior is visible in [components/garage/garage-dashboard.tsx:66-76](components/garage/garage-dashboard.tsx:66) and [app/api/analyze/route.ts:22-24](app/api/analyze/route.ts:22)
- **What's wrong:** The privacy of user data (garage vehicles, saved parts) depends entirely on RLS policies configured inside Supabase, and those policies are not in the code, so this audit cannot confirm them. Two observations raise the stakes: (1) the garage only filters by user ID *in the browser*, which is trivial to bypass if RLS is weak; (2) the app successfully inserts into `analysis_results` using the public "anon" key, proving anonymous inserts are allowed on that table — if anonymous *reads* are also allowed, every user's analysis history and photo URLs are publicly readable.
- **Why it matters:** If RLS is misconfigured, any user could read or delete another user's garage. That is the worst-case trust and privacy failure for the product.
- **Recommended fix:** Have a developer open the Supabase dashboard and verify, table by table: `garage_vehicles` and `identified_parts` allow select/insert/update/delete only where `user_id = auth.uid()`; `analysis_results` and `affiliate_clicks` deny anonymous select; the `vehicle_images` bucket denies anonymous listing. Then export the policies as SQL migration files into the repo so this is checkable in the future.

### H2. FTC affiliate disclosure is missing where the money links actually are

- **Files:** Disclosure component exists at [components/ui/affiliate-disclosure.tsx](components/ui/affiliate-disclosure.tsx) but is only used on two page types: [app/vehicles/[make]/[model]/page.tsx:220](app/vehicles/[make]/[model]/page.tsx:220) and [app/vehicles/[make]/[model]/[generation]/page.tsx:219](app/vehicles/[make]/[model]/[generation]/page.tsx:219). It does not appear near the Amazon buttons in [components/home/results-display.tsx](components/home/results-display.tsx) (homepage and category-page analysis results, part identifier results) or in the garage detail views, and it is not linked from the footer ([components/ui/site-footer.tsx](components/ui/site-footer.tsx)).
- **What's wrong:** The screens that generate nearly all affiliate clicks (analysis results with "Buy on Amazon" buttons) carry no disclosure at all. Where the disclosure does exist, it is collapsed behind a click, which is weaker than the FTC's "clear and conspicuous" standard. This is also an Amazon Associates program requirement — Amazon can close accounts over it.
- **Why it matters:** Regulatory risk and, more practically, risk to your Amazon Associates account, which is currently 100% of revenue.
- **Recommended fix:** Render the `AffiliateDisclosure` component (or a one-line always-visible version) directly beneath every results section that contains Amazon links, and add a short disclosure line plus link in the site footer. This is a few lines of code.

### H3. Garage "Search on Amazon" links skip your click tracking

- **Files:** [components/garage/vehicle-detail-sheet.tsx:222](components/garage/vehicle-detail-sheet.tsx:222), [components/garage/part-detail-sheet.tsx:280](components/garage/part-detail-sheet.tsx:280), and a share-text link at [components/garage/part-detail-sheet.tsx:34](components/garage/part-detail-sheet.tsx:34)
- **What's wrong:** These links go straight to `amazon.com` (with the affiliate tag manually appended via [lib/amazon.ts](lib/amazon.ts)) instead of through `/go`. Everywhere else on the site correctly uses `/go`. The shared text in the part-share feature includes an Amazon link with *no* affiliate tag at all.
- **Why it matters:** Clicks from your most engaged users (people who saved things to their garage) never appear in your `affiliate_clicks` analytics, so revenue attribution is blind exactly where intent is highest. The untagged share link gives away commissions.
- **Recommended fix:** Replace both direct links with `/go?...` URLs (the same pattern used in `results-display.tsx`), and add the tag or a /go URL to the share text. Then `lib/amazon.ts` can be deleted.

### H4. A canonical-tag mistake tells Google some pages are the homepage

- **Files:** [app/layout.tsx:49-51](app/layout.tsx:49) sets `canonical: '/'` for the whole site; [app/privacy/page.tsx](app/privacy/page.tsx) and [app/my-garage/page.tsx](app/my-garage/page.tsx) never override it
- **What's wrong:** A "canonical" tag tells Google which URL is the true version of a page. Because the root layout sets it to `/`, any page that doesn't set its own canonical (currently `/privacy` and `/my-garage`) tells Google "I am a duplicate of the homepage." Any future page added without its own canonical inherits the same bug silently. Separately, `/my-garage` (a private, logged-in page) has no "noindex" instruction.
- **Why it matters:** For an SEO-driven business, mis-declared canonicals can suppress pages from search results, and the failure mode is invisible until traffic doesn't arrive.
- **Recommended fix:** Remove `alternates.canonical` from `app/layout.tsx` entirely (each page already declares its own), and add `robots: { index: false }` metadata to `/my-garage`.

### H5. The homepage displays made-up statistics

- **Files:** [components/home/stats-bar.tsx:13-18](components/home/stats-bar.tsx:13)
- **What's wrong:** "12,847 Vehicles Analyzed," "4,312 Parts Identified," "91% Average Confidence," and "10,000+ Vehicle Models Supported" are hardcoded constants in the code, not real numbers.
- **Why it matters:** If a user, journalist, or partner ever discovers these are fabricated (and view-source makes it easy), the credibility damage far outweighs the conversion benefit. It can also be considered a deceptive claim.
- **Recommended fix:** Either compute real counts from the `analysis_results` table (a small server query, cached daily) or change the labels to non-quantified claims ("Thousands of vehicles analyzed") until real numbers are worth showing.

---

## MEDIUM

### M1. "Save to My Garage" likely fails when the AI returns a year range

- **Files:** [components/save-to-garage-button.tsx:25](components/save-to-garage-button.tsx:25) saves `year` as text like `"2021-2024"`; [types/supabase.ts:53](types/supabase.ts:53) says the database column is a number; the AI is explicitly instructed to return ranges at [app/api/analyze/route.ts:90](app/api/analyze/route.ts:90)
- **What's wrong:** The AI is told to answer with a year *range* whenever it isn't sure of the exact year (very common). If the database column is numeric, inserting `"2021-2024"` fails and the user just sees "Failed to save vehicle. Please try again" with no explanation. The type file shows signs someone patched around this (`year: number | string`) rather than fixing it.
- **Why it matters:** Save-to-Garage is the top of your future subscription funnel. A save that silently fails for a large fraction of analyses quietly kills account creation.
- **Recommended fix:** Check the real column type in Supabase. Either make the column text, or parse the first year out of the range before saving and store the range in the JSON blob that's already saved alongside.

### M2. Giant blog images will tank Core Web Vitals on your SEO pages

- **Files:** `public/blog/images/truck-trim-levels-explained-hero.png` (4.9 MB), `public/blog/images/leveling-kit-vs-lift-kit-hero.png` (3.5 MB), `public/images/sample-result-raptor.jpg` (1.1 MB), `public/logo.png` (452 KB); rendered as plain eager-loading `<img>` tags in [app/blog/[slug]/page.tsx:287-293](app/blog/[slug]/page.tsx:287); blog fonts loaded via render-blocking stylesheet in [app/blog/layout.tsx](app/blog/layout.tsx)
- **What's wrong:** Blog hero images are served at full multi-megabyte size with no compression, no responsive sizing, and no lazy loading (the blog deliberately bypasses Next.js's image optimizer). Two articles ship ~4–5 MB images as the largest element on the page, which directly worsens LCP — one of Google's ranking signals. The blog also loads Google Fonts in a render-blocking way, unlike the rest of the site which uses the optimized `next/font` system.
- **Why it matters:** These are precisely the pages meant to win search traffic; slow LCP works against their rankings and mobile readers on cell connections will bounce.
- **Recommended fix:** Convert the two PNG heroes to compressed WebP/JPEG (target under 200 KB), switch blog `<img>` tags to `next/image`, and move the blog's DM Sans/DM Serif fonts into `next/font` in the blog layout.

### M3. Four different Supabase connection setups, plus dead files committed to the repo

- **Files:** [lib/supabase-client.ts](lib/supabase-client.ts) (used by garage), [lib/supabase.ts](lib/supabase.ts) (used by nothing — dead code), [lib/supabase-server.ts](lib/supabase-server.ts), a fourth inline client in [components/auth-provider.tsx:12](components/auth-provider.tsx:12), plus direct `createClient` calls in [app/actions.ts:17](app/actions.ts:17) and [app/api/analyze/route.ts:21](app/api/analyze/route.ts:21). Also committed: [test-db.js](test-db.js) (a one-off debug script), [lint_output.txt](lint_output.txt) (a stale lint log referencing a different machine's paths), an unused validation module [lib/env.ts](lib/env.ts), and a default template [README.md](README.md).
- **What's wrong:** Nothing is broken today, but five ways of connecting to the same database means a future change (like switching auth storage) must be made in five places, and one will be missed. The dead files confuse anyone new to the project.
- **Why it matters:** This is the main maintainability trap in the codebase. It makes every future developer slower and every auth-related bug harder to trace.
- **Recommended fix:** Consolidate to two clients: one browser client (have `auth-provider.tsx` and the garage share it) and one server client. Delete `lib/supabase.ts`, `test-db.js`, `lint_output.txt`, and either use or delete `lib/env.ts`. Replace the README with a short real description of the project. A half-day cleanup.

### M4. Brand colors have drifted into multiple unofficial variants

- **Files:** Hardcoded hex values across `components/` and `app/`: the official orange `#E8712B` (30 uses) competes with `#EF5A2A` (garage dashboard, [components/garage/garage-dashboard.tsx:233](components/garage/garage-dashboard.tsx:233)), `#d4652a`, and `#E38900`; the hero/stats background is `#003223` (8 uses) rather than the brand dark green `#0D2818` (7 uses)
- **What's wrong:** There are at least three different oranges and two different dark greens in production, applied as raw hex codes instead of the design tokens defined in [app/globals.css](app/globals.css). Good news on the copy side: the audit found **zero em dashes** in any rendered copy, MDX content, or metadata — the brand rule is fully respected.
- **Why it matters:** Slightly-off colors read as unpolished, and hardcoded hex values mean a future brand tweak requires hunting through dozens of files.
- **Recommended fix:** Standardize on the CSS variables (`--primary`, etc.) already defined in `globals.css`, and do a find-and-replace of `#EF5A2A`/`#d4652a`/`#E38900` to the official orange and `#003223` to the official dark green (or consciously bless `#003223` as the official value and update the brand doc).

### M5. Structured data references pages that don't exist

- **Files:** [app/blog/[slug]/page.tsx:145](app/blog/[slug]/page.tsx:145) (author URL `/about` — no such page), [app/blog/[slug]/page.tsx:179](app/blog/[slug]/page.tsx:179) (breadcrumb URL `/blog/category/...` — no such route); Product schema on generation pages ([app/vehicles/[make]/[model]/[generation]/page.tsx:141-165](app/vehicles/[make]/[model]/[generation]/page.tsx:141)) declares offers with no price
- **What's wrong:** The blog's machine-readable metadata points Google at URLs that return "page not found," and the vehicle pages' Product markup omits price, which Google Search Console commonly flags as a warning that can disqualify rich results.
- **Why it matters:** Structured data is how you win enhanced search listings; broken references and warnings reduce eligibility.
- **Recommended fix:** Point the author URL at the homepage (or build a small /about page), use `/blog` for the category breadcrumb until category pages exist, and either add indicative prices to Product offers or simplify to an ItemList without nested Product/Offer markup.

---

## LOW

### L1. Users see raw internal IDs and leftover AI-assistant notes shipped in code

- **Files:** [components/home/upload-zone.tsx:309](components/home/upload-zone.tsx:309) displays "Vehicle {item.id}", which renders as "Vehicle 550e8400-e29b-41d4..." (a random internal identifier) above each uploaded photo group; [components/home/upload-zone.tsx:72-83](components/home/upload-zone.tsx:72) contains leftover notes from an AI coding session ("WAIT, I need to inject onReset... Changing strategy to multi_replace.") committed as comments.
- **Why it matters:** The visible UUID looks broken to users; the stray comments are harmless but signal unreviewed code to anyone reading it.
- **Recommended fix:** Show "Vehicle 1", "Vehicle 2" (by position) instead of the ID, and delete the comment block.

### L2. Footer links break when you're not on the homepage

- **Files:** [components/ui/site-footer.tsx:11](components/ui/site-footer.tsx:11) and [:17](components/ui/site-footer.tsx:17) link to `#how-it-works` and `#use-cases`
- **What's wrong:** These are same-page anchors. From any page other than the homepage (e.g., a blog post), clicking them does nothing or jumps nowhere, because the target section isn't on that page. (Note: `#use-cases` only exists on category pages, not the homepage, so that link is broken even there.) The footer also omits links to the blog and vehicle category pages, which are internal-linking opportunities for SEO.
- **Recommended fix:** Change to `/#how-it-works`, fix or remove the use-cases link, and add Blog + category links and the affiliate disclosure line (see H2) to the footer.

### L3. Miscellaneous small items

- **Garage Amazon links lack `rel="nofollow sponsored"`** ([components/garage/vehicle-detail-sheet.tsx:224](components/garage/vehicle-detail-sheet.tsx:224)) — becomes moot if H3's /go fix is applied.
- **The `/go` logger accepts anything** ([app/go/route.ts:34-51](app/go/route.ts:34)) — bots can spam junk rows into `affiliate_clicks` and skew your analytics. No security risk (destination is still allowlisted to Amazon, which is why "open redirect" is *not* a finding), but consider basic bot filtering or a length cap on parameters.
- **Lint errors are accumulating** — the committed [lint_output.txt](lint_output.txt) shows real errors (unescaped quotes, a stray `any`). Running `npm run lint` in CI and fixing the ~20 errors keeps the codebase honest.
- **Homepage is one giant client component** ([components/home/vehicle-analyzer.tsx](components/home/vehicle-analyzer.tsx) wraps the hero, how-it-works, and all marketing sections) — content still renders server-side so SEO is OK, but it ships more JavaScript than needed and slightly hurts interactivity metrics (INP). A future refactor could move static sections out; not urgent.

---

## Quick Wins (high impact, low effort)

1. **Fix the `startsWith` URL check and add origin validation to all image-fetching actions** (C3) — a one-helper change that closes the SSRF hole.
2. **Add the affiliate disclosure under every results section and in the footer** (H2) — an afternoon of work that removes your largest compliance risk.
3. **Route the two garage Amazon links through /go** (H3) — restores click tracking for your highest-intent users.
4. **Remove `canonical: '/'` from the root layout and noindex /my-garage** (H4) — two-line SEO fix.
5. **Compress the two multi-megabyte blog hero images** (M2) — no code required, immediate Core Web Vitals improvement.
6. **Replace the fake stats with real counts or unquantified copy** (H5).
7. **Delete dead files** (`test-db.js`, `lint_output.txt`, `lib/supabase.ts`) and replace the boilerplate README (M3).
8. **Run the RLS checklist in the Supabase dashboard** (H1) — one hour with a developer, and it settles the biggest open question in this audit.

---

*End of report. No fixes have been implemented per the audit's read-only scope.*
