# Post-Fix Verification Report

## Summary

| Batch | Verdict | Note |
|-------|---------|------|
| Batch 1 — API lockdown | PASS | Validation correctly blocks non-Supabase URLs in all image entry points. |
| Batch 2 — Save flow and toasts | PASS | Toaster is present, year normalization catches AI ranges, errors are visible. |
| Batch 3 — Affiliate link integrity | PASS | All paths route through `/go` with proper `rel` tags; direct Amazon linking is gone. |
| Batch 4 — Analytics funnel | PASS | Funnel events fire on correct triggers; `/go` securely handles logging and cookies. |
| Batch 5 — Gemini cost pass | PASS | Optimization and validation logic is correct, and all quality-check leftovers have been removed. |
| Batch 6 — SEO hygiene | PASS | FAQ schemas are unified with UI text; 404 schema links and fragment paths are fixed. |

## Per-batch detail

### Batch 1 — API lockdown
1. `app/api/analyses/route.ts` validates `imageUrl` before touching DB/Gemini: **PASS** (uses `assertSupabaseStorageUrl`, fails with 400).
2. Validation exists in `/api/analyze` and `app/actions.ts`: **PASS**.
3. Validation lives in exactly one shared helper: **PASS** (`lib/url-validation.ts`).
4. `app/api/analyze/route.ts` exports `maxDuration = 60`: **PASS**.

### Batch 2 — Save flow and toasts
1. `<Toaster />` is rendered exactly once, in the root layout: **PASS**.
2. Shared year-normalization helper exists in `lib/`: **PASS** (`lib/normalize-year.ts` parses ranges and validates against 1900–2099).
3. Both save paths use it: **PASS** (used in `auth-provider.tsx` and `use-save-to-supabase.ts`).
4. A null-normalized year blocks insert and surfaces a toast: **PASS** (`toast.error` fires and the function returns early).

### Batch 3 — Affiliate link integrity
1. Amazon buttons link through `/go` with source parameter, registry config, `target="_blank"`, and `rel="nofollow sponsored noopener"`: **PASS**.
2. Share text contains absolute `/go` URL: **PASS** (in `components/garage/part-detail-sheet.tsx`).
3. `lib/amazon.ts` is deleted and nothing imports it: **PASS**.
4. Repo-wide `visualfitment-20` appears exactly once: **PASS** (in `lib/affiliate/merchants.ts`). No bare amazon links exist outside the registry.
5. Every outbound affiliate link carries exactly `rel="nofollow sponsored noopener"`: **PASS**.

### Batch 4 — Analytics funnel
1. `photo_analysis_started` fires from `handleStartBatch` with distinct `entry_point`: **PASS**.
2. Save events fire only on successful saves, exactly once: **PASS**.
3. Part-identification completion event fires once per part: **PASS**.
4. `setEntryDoor('blog')` is called from client component in blog layout/page: **PASS** (`components/blog-entry-door.tsx`).
5. `analytics-tracker.tsx` has guarded `auxclick` listener: **PASS**.
6. `/go` logging path emits `console.error` on failure and redirect proceeds: **PASS**.
7. `/go` reads/sets `vf_sid` cookie and writes it to `session_id`: **PASS**.
8. No pre-existing event renamed/parameters changed: **PASS**.

### Batch 5 — Gemini cost pass
1. No quality-check Gemini call remains, its schema and components are gone: **PASS** (Logic, schema, `QualityWarningDialog`, and the leftover `qualityIssues` state property in `vehicle-analyzer.tsx` are all completely removed).
2. `lib/image-processing.ts` downscales uploads (1568 px max, ~0.8 JPEG), and homepage hero shares this: **PASS** (Hero uses `downscaleImage` from the new `lib/image-processing.ts` before creating the upload URL).
3. `lib/pipeline.ts` fetches and encodes images exactly once: **PASS**. `/api/analyze` was NOT converted into a multi-stage endpoint: **PASS**.
4. Sniper escalation skipped when scout returns hardcoded Unknown: **PASS** (checked in `app/actions.ts:304`).
5. No Gemini call includes `codeExecution`: **PASS**.
6. `AnalysisResultsSchema` validates fitment response in both places, preventing invalid blobs: **PASS**.

### Batch 6 — SEO hygiene
1. Category pages define FAQ in exactly one exported array, JSON-LD matches visible text: **PASS**.
2. Footer links use `/#how-it-works` and `/#use-cases`: **PASS**.
3. Blog post JSON-LD contains no `/blog/category/` and no `/about` URL: **PASS**.
4. `app/my-garage/page.tsx` metadata includes `robots: { index: false, follow: false }`: **PASS**.

## Regression findings
- `next build` passes with zero errors or warnings.
- Verified that no user-facing em dashes (`—`) were introduced (only en dashes `–` which were already present).
- No scope creep or unintentional logic modifications were found outside the targeted flows.

## Punch list
*All punch list items have been completed.*
