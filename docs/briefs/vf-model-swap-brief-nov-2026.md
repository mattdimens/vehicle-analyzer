# VisualFitment: Gemini Model Swap Brief (Nov 2026)

**For:** Claude Code, working in the `vehicle-analyzer` repo (GitHub: `mattdimens/vehicle-analyzer`)
**From:** Matt (founder). I am not a developer. Explain anything I need to do myself in plain steps.
**Design reference:** none. No UI changes in this brief.

---

## Problem statement

The two-pass recognition pipeline uses two Gemini model constants in `lib/gemini.ts` (used by `lib/analysis-stages.ts`): `SCOUT_MODEL` (fast first pass, currently `gemini-3.6-flash`) and `SNIPER_MODEL` (high-accuracy escalation, currently `gemini-3.1-pro-preview`).

Two reasons to move:

1. **3.1 Pro Preview is the tightest limit on our account.** At Tier 1 it is capped at 25 requests per minute and 250 requests per day. Every other model we would use has 1K RPM and 10K or unlimited RPD. 250 escalations a day is a hard ceiling on the product.
2. **It is a preview model with no shutdown date.** Its predecessor (`gemini-3-pro-preview`) was retired with about three weeks' notice. Gemini 4 is GA, scores higher on independent vision benchmarks, and costs the same or less at our volume.

Target models:

| Role | Today | Target | Why |
|---|---|---|---|
| `SNIPER_MODEL` | `gemini-3.1-pro-preview` | `gemini-4-carbon` | Best vision scores, unlimited daily requests, similar latency to 3.1 Pro |
| `SCOUT_MODEL` | `gemini-3.6-flash` | `gemini-3.8-flash` | Same price, newer, slightly better vision; drop-in |

Fallback if Carbon fails the eval: `gemini-4-argon` with the lowest thinking level.

---

## How to work through this brief

1. **Explore before changing.** Read the files named below, tell me what you found and your plan, then build.
2. **Task 1 is an eval and a report. Do not change production constants in Task 1.** I decide after reading the results.
3. **Task 2 only starts after I say "go".**
4. **One branch and one PR per task.** Suggested: `chore/model-eval`, `chore/gemini-4-swap`.
5. **Before every PR run:** `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`. All must pass.
6. When each task is done, give me a two to three line summary: what changed, which files, and how I check it.

---

## Guardrails (apply to both tasks)

**Do not change:**
- Any URL, slug or route.
- Any GA4 event name or parameter.
- The prompts sent to the models, the Zod schemas in `lib/schemas.ts`, or the scout-to-sniper escalation logic (when the sniper fires). This brief changes which model answers, not what we ask or how we decide to escalate.
- The polling interval, stale rule, or retry behavior on `/r/[id]`.
- Supabase schema or RLS. No migrations.
- Image downscaling or the 10MB limit.

**Secrets:** never put an API key in code or in the eval output. The eval script reads the key from the same environment variable the app uses.

**Cost:** the eval must never run against production traffic. It runs locally, once, on a fixed set of photos. Cap it at 60 photos x 6 configs. Print the total tokens used at the end.

**Copy rules (for any comment or doc you write):** no em dashes.

---

## Task 1: Eval the candidates on our real photos (REPORT ONLY)

**Files to read first:** `lib/gemini.ts`, `lib/analysis-stages.ts`, `lib/pipeline.ts` (`runPipeline`, `runPartPipeline`), `lib/schemas.ts`, the Supabase storage or table code that saves uploaded photos, and `lib/analysis-errors.ts`.

### 1a. Find a test set

Uploaded photos are retained: every `analyses` row stores a public `vehicle_images` URL. Matt exports the 25 most recent completed vehicle analyses and 25 most recent completed part analyses from the production SQL editor (read-only query in the eval script's header) to `eval/test-set.csv`.

### 1b. Write the eval script

`scripts/eval-models.ts`, run with `npx tsx --env-file=.env.local scripts/eval-models.ts eval/test-set.csv`. For each photo it must:

- Run the **exact** production prompt and schema for that kind (vehicle or part) through each config, with the same request options production uses. Production passes no `config` at all (no thinking setting, no structured-output flag), so "as production" means no config. Gemini 4 is also run with `thinkingLevel: LOW`, since the default level is where the extra latency would come from.
  - `gemini-3.1-pro-preview` (current sniper, the baseline)
  - `gemini-4-carbon` (default, and LOW thinking)
  - `gemini-4-argon` (LOW thinking)
  - `gemini-3.6-flash` (current scout, baseline)
  - `gemini-3.8-flash`
- Record per call: model, photo id, parsed result, confidence, Zod pass/fail, wall-clock latency in ms, input tokens, output tokens, and the raw error if any.
- Write results to `eval/results-{date}.csv` and a markdown report to `eval/report-{date}.md`.

### 1c. Report

A markdown table per role:

**Sniper candidates** (3.1 Pro vs Carbon vs Argon), on all 50 photos:
- Agreement with the recorded production answer (make/model for vehicles; part name for parts).
- Where they disagree, list the photo id and all answers so I can judge which is right.
- Zod failure count.
- Median and p90 latency.
- Mean tokens per call and estimated cost per 1,000 escalations at current list price: 3.1 Pro $2.00 in / $12.00 out per 1M; Carbon and Argon $2.00 / $10.00 through Nov 30, then $4.00 / $20.00.

**Scout candidates** (3.6 Flash vs 3.8 Flash), same columns. Both are $0.75 / $3.75 through Dec 31, then $1.50 / $7.50.

End with one paragraph: which model you would pick for each role and why, and anything that surprised you (for example, if a model invents part numbers or year ranges more often).

### Done when (Task 1)

- The script runs locally with one command and does not touch production code paths or write to Supabase.
- The report is in the PR description, with the CSV committed under `eval/`.
- No API key appears anywhere in the diff.

**STOP here and wait for my decision.**

---

## Task 2: Swap the constants (after approval)

**Files to read first:** `lib/gemini.ts`, `lib/analysis-errors.ts` (the `model` kind classifier from the reliability brief), `test/part-identification-test.ts` (stubs Gemini by model name), `README.md`, `REVIEW.md`, and `.env.example`.

### 2a. The swap

- Set `SNIPER_MODEL` to the model I approve (expected: `gemini-4-carbon`) and `SCOUT_MODEL` to `gemini-3.8-flash`.
- If the eval shows the sniper needs `thinkingLevel: LOW` to hold latency, add that config to the sniper call only, and explain it.
- Grep the repo for `gemini-3.1-pro-preview`, `gemini-3-pro-preview` and `gemini-3.6-flash` and list every remaining hit in the PR. Tests and docs should reference the new IDs.
- Pin the stable IDs. Do not use a `-latest` alias.

### 2b. Keep the retirement alarm honest

The `model` error kind in `classifyAnalysisError` fires on a 404 or "model not found". Confirm it still catches the error Google returns when a Gemini 4 model ID is wrong or retired (write a unit test with the realistic error shape). The alert email body already says "Check lib/analysis-stages.ts"; update it to name `lib/gemini.ts`.

### 2c. Verify on a preview

On the Vercel preview, run one vehicle analysis and one part analysis end to end. Give me the two `/r/{id}` URLs and confirm in the Vercel logs that the scout call used `gemini-3.8-flash` and the sniper call (force an escalation with a hard photo if needed) used the new sniper ID.

### Done when (Task 2)

- Both constants updated; no stale model IDs anywhere in the repo.
- Unit tests pass, including the new `model` error-shape test.
- Preview analyses complete for both kinds, and the loading screen's "Comparing close matches" step is not noticeably slower than today (tell me the sniper latency you observed).

---

## After it ships

- **Dec 1, 2026:** Gemini 4 Carbon and Argon move from $2 / $10 to $4 / $20 per 1M tokens.
- **Jan 1, 2027:** 3.8 Flash (and 3.6 Flash) move from $0.75 / $3.75 to $1.50 / $7.50.
- Watch the Rate Limit page in Google AI Studio for a week. The sniper row should now show 1K RPM / Unlimited RPD instead of 25 / 250.
- Completion-rate query from the reliability brief, by kind, for the week before and after the swap (exclude Nov 4 to 10).
