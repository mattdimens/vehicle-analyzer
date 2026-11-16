# VisualFitment: Recognition Pipeline Brief (Nov 2026)

**For:** Claude Code, working in the `vehicle-analyzer` repo (GitHub: `mattdimens/vehicle-analyzer`)
**From:** Matt (founder). I am not a developer. Explain anything I need to do myself in plain steps.
**Design reference:** none. No visual changes are planned; see the guardrail on UI.
**Replaces:** Task 2 of `docs/briefs/vf-model-swap-brief-nov-2026.md`. The model swap is parked until this brief is done.

---

## What happened (context)

We tried to swap the Gemini models (PR #67 eval, PR #68 swap, now a draft). On the Vercel preview the swap failed:

- The new scout (`gemini-3.8-flash`) named a vehicle for a photo of a broken bumper lying on the ground, three times out of three (RAV4 at 88, Highlander at 92, Yamaha YZF-R7 at 88). All above the 85 threshold, so the sniper never ran.
- The new sniper (`gemini-4-carbon`) did not answer one part photo within 2 minutes on two attempts, so the visitor got "Analysis timed out". A third escalation took 52 seconds.

Production is still on `gemini-3.6-flash` and `gemini-3.1-pro-preview`.

Reading the prompts afterwards, most of this is our process, not the models:

1. **The vehicle prompt forces a guess.** `buildFitmentPrompt` says "Analyze the vehicle shown", asks for the "primary, most likely vehicle" with required `make` and `model`, and never offers an Unknown answer. `vehicle_present` is defined as true for any vehicle "even if blurry, partial", so a loose bumper counts.
2. **The escalation gate is the scout grading itself.** The sniper runs only when the scout's own `confidence_score` is 85 or lower. There is no definition of what 90 means, so each model has its own scale. Today's scout happens to score its guesses low. That is luck, not design.
3. **The sniper repeats the whole job blind.** It gets the identical prompt (identification, trim, cab, bed, engine, alternatives, accessories, tiered recommendations, alt text) and is not told what the scout answered.
4. **Nothing limits a slow call.** `callGemini` sends no timeout, no JSON mode and no thinking setting. A slow sniper call dies on the 2-minute stale rule and the visitor gets nothing, even though the scout already had an answer.

This brief fixes the process first, builds a test set that measures the failures we care about, and only then reopens the model question.

---

## How to work through this brief

1. **Explore before changing.** Read the files named in each task, tell me what you found and your plan, then build. If anything here conflicts with the code, stop and tell me.
2. **Tasks run in order.** Task 2 (test set and baseline) must be finished before Task 3 (prompt changes), so every prompt change is measured against a baseline.
3. **Tasks 2 and 4 are REPORT ONLY.** Stop and wait for me after each.
4. **One branch and one PR per task.** Suggested: `fix/gemini-timeouts`, `chore/eval-test-set`, `feat/identify-then-verify`, `chore/model-eval-2`.
5. **Before every PR run:** `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`. All must pass.
6. When each task is done, give me a two to three line summary: what changed, which files, and how I check it.

---

## Guardrails (apply to every task)

**Do not change:**
- Any URL, slug or route.
- Any GA4 event name or parameter.
- The shape of `result_data` that the UI and saved analyses read (`AnalysisResults`, `PartIdentification`, `DetectedProduct`). New optional fields are fine. Old saved rows must still render.
- The model constants. `SCOUT_MODEL` and `SNIPER_MODEL` stay as they are on `main` until I approve Task 4.
- The polling interval or the 2-minute stale rule on `/r/[id]`.
- Supabase schema or RLS. No migrations without asking.
- Any visitor-facing copy or layout. If a change in Task 3 makes a new state reachable (for example a vehicle result with make "Unknown"), show me how the current UI renders it before touching the UI.
- The rule that results always show an Amazon link, with low confidence labeled clearly.

**Allowed in this brief (it was off limits in earlier ones):** the prompts in `lib/analysis-stages.ts`, the escalation logic, and one extra scout call per vehicle analysis (Task 3b).

**Secrets:** no API keys in code or eval output.

**Cost:** evals run on a fixed test set, never on production traffic. Print total tokens and cost at the end of each run. Tell me before any single run that will exceed 600 calls.

**Copy rules (comments and docs):** no em dashes.

---

## Task 1: Make slow calls survivable (ships on its own)

**Files to read first:** `lib/analysis-stages.ts` (`callGemini`, all three cascades), `lib/gemini.ts`, `lib/pipeline.ts`, `lib/analysis-errors.ts`, `test/part-identification-test.ts`, and the draft PR #68.

No prompt changes in this task.

### 1a. Timeouts with a fallback

- Give `callGemini` a per-call timeout. Check what the installed `@google/genai` supports (an abort signal or an HTTP timeout option) and use it. Tell me which.
- **Sniper calls:** 60 seconds. If the sniper times out, errors or returns invalid JSON, **keep the scout's result** and finish the analysis. This already happens for invalid JSON; extend it to timeouts and errors in all three cascades (vehicle, product refinement, part).
- **Scout calls:** 45 seconds. A scout timeout is a real failure: throw so it is classified as `timeout`.
- Log every fallback in one searchable line, for example `Sniper fallback [timeout] part {id} after 60012ms`.
- Outage errors must still surface: if the sniper fails with a `billing`, `auth` or `model` kind, still send the alert from the reliability brief, even though the visitor gets the scout result.

### 1b. Record that a fallback happened

When the scout's answer is used because the sniper failed, the result is one the scout itself was unsure about. Tell me whether there is an existing field I can use to mark it (so the low-confidence label shows). If it needs a new optional field in `result_data`, propose it. No new column.

### 1c. Salvage from PR #68, then close it

Bring over the two things in #68 that are still right: the `classifyAnalysisError` tests for the Gemini 4 error shape, and the alert text fix (it should name `SCOUT_MODEL` and `SNIPER_MODEL` in `lib/gemini.ts`, not `lib/analysis-stages.ts`). Do not bring the constant change, the `SNIPER_CONFIG` or the README edit. Then close #68 with a comment pointing at this brief.

### Done when (Task 1)

- Unit tests: sniper timeout keeps the scout result for vehicle, product and part; scout timeout throws and classifies as `timeout`; a sniper `billing` error keeps the scout result **and** triggers the alert path.
- On a preview, a normal vehicle analysis and a normal part analysis complete as before.
- No analysis can sit in `verifying` for longer than about 60 seconds.

---

## Task 2: A test set that measures what we care about (REPORT ONLY)

**Files to read first:** `scripts/eval-models.ts`, `eval/test-set.csv`, `eval/report-2026-11-13.md`.

The first test set had 38 distinct photos, only 9 showing a whole vehicle, and no labels except what production had answered. It could not measure hallucination, and the cloud proxy cut calls at 30 seconds, which hid the worst results.

### 2a. Build `eval/test-set-v2.csv`

Target about 70 photos, each with a human-checked label:

| Group | Count | What it tests | Label |
|---|---|---|---|
| Clear vehicles | 20 | Correct make, model, generation | make, model, true year range for that generation |
| Hard vehicles (partial, dark, modified, rare or non-US) | 10 | Honest uncertainty | same, or "unknown" if a person could not tell |
| Loose parts and fragments sent to the vehicle analyzer | 15 | Not inventing a vehicle | `no_vehicle` |
| Not automotive at all | 5 | `vehicle_present` false | `no_vehicle` |
| Parts with a legible number | 8 | Copying the number exactly | part name, exact number |
| Parts without a number | 12 | Naming the part, not inventing a vehicle | part name, vehicle only if truly determinable |

How to build it:

1. Give me read-only SQL for the production Supabase SQL editor that pulls candidates for each group from `analyses` (for example: vehicle analyses with confidence 90+, vehicle analyses that ended Unknown or `vehicle_present` false, part analyses with and without `partNumber`). About 150 rows total, de-duplicated by `image_url`. I run it and give you the CSV.
2. Look at every photo yourself and propose a group and a label for each. Drop duplicates and anything with a face, a readable license plate or other personal detail.
3. Give me the proposed labels as a CSV I can open in Google Sheets, with the photo URL in the first column. I correct them and send it back. **My corrected file is the ground truth.**

### 2b. Upgrade the eval script

- Score against the labels, not against what production said. Report per group:
  - **Correct:** make and model match the label (vehicles), or part name matches (parts).
  - **Year covers truth:** the returned range contains the labeled range or overlaps it; report "too narrow" separately.
  - **Invented vehicle:** on `no_vehicle` photos, any make other than Unknown. Split into "at or below the escalation threshold" and "above it" (above is what reaches a visitor).
  - **Invented number:** a `partNumber` that is not exactly the labeled one.
  - **Honest unknown:** said Unknown where the label is unknown.
- Run the **whole cascade**, not single calls: scout, the gate, sniper, exactly as `runFitmentAnalysis` and `runPartIdentification` do, and record which model produced the final answer, the escalation rate, and end-to-end time.
- **Fix the timing problem.** Find out whether the 30-second cutoff in cloud sessions can be raised. If not, propose the simplest way to run the eval somewhere without it and tell me the options before building anything (for example a preview-only route protected by a secret and disabled in production, or exact steps for me to run it on my Mac). No call may be silently cut off: a cut-off call must be reported as its own category.
- Run each photo twice so we can see how often the same model disagrees with itself.

### 2c. Baseline report

Run today's prompts on today's models (`gemini-3.6-flash` and `gemini-3.1-pro-preview`) and report the numbers above. This is the bar everything else has to beat.

### Done when (Task 2)

- `eval/test-set-v2.csv` is committed with my corrected labels.
- The baseline report is in the PR description and in `eval/`.
- I can see, as plain numbers, how often production today invents a vehicle, narrows a year range wrongly, or times out.

**STOP here and wait for me.**

---

## Task 3: Identify, then verify, then enrich

**Files to read first:** `lib/analysis-stages.ts` (all of it), `lib/schemas.ts`, `lib/pipeline.ts`, `app/api/analyze/route.ts`, `app/api/analyze/part/route.ts`, `app/actions.ts`, `components/analysis/analysis-view.tsx` and `analysis-results-view.tsx` (how Unknown and `vehicle_present === false` render today), and the tests that stub Gemini by model name.

Work in the three steps below. After each step, re-run the Task 2 eval and report the change against the baseline. If a step makes any headline number worse, stop and tell me before going on.

### 3a. A small identification prompt with an honest way out

Split vehicle identification out of the big prompt. The identification call asks only for what identifies the vehicle: `vehicle_present`, make, model, year range, trim, cab, bed, type, color, condition, confidence, other possibilities, and a short `evidence` list (what in the photo supports the answer).

The wording is yours to write and tune against the test set, but it must do these things:

- **Start by deciding what the photo shows**, before naming anything. A loose part, a fragment, or a close-up with no identifying features is not a vehicle to identify. Tell the model what to return in that case: `vehicle_present` false, make and model "Unknown", low confidence.
- **Say that Unknown is a correct answer** and that a wrong confident answer is the worst outcome, because visitors buy parts from it.
- **Define the confidence scale** in terms of evidence, for example: 90 and up only when a badge, model name or unmistakable generation-specific feature is visible; 70 to 89 when the body style and several design cues agree; below 70 when the answer rests on general shape. Tune the bands on the test set.
- **Year ranges:** return the full production range of the generation unless a specific visible feature narrows it, and name that feature in `evidence`.
- No examples that name a specific make or model in a way that could bias answers.

### 3b. Move the extras to their own scout call

Accessories, tiered recommendations (the `promptContext` category logic), engine details and alt text move to a second call that runs **only on the scout model**, after the vehicle is settled, with the settled vehicle passed in. It can run in parallel with `detectProductTypes`.

- Merge the two results into the same `AnalysisResults` shape the app uses today, so the UI, saved rows and `/api/analyze` responses do not change.
- If the vehicle is Unknown or not present, tell me what the current code returns for accessories and keep that behavior.
- The category pages (`/wheels-rims`, `/truck-bed-covers`, `/nerf-bars-running-boards`) must return tiered recommendations exactly as today.
- This adds one scout call per vehicle analysis. Report the cost and latency difference from the eval.

### 3c. The sniper verifies instead of repeating

- The sniper gets the photo, the scout's answer and its evidence, and one job: confirm it, correct it, or say it cannot be determined. Same output shape as the identification call.
- **New escalation rule.** Escalate when any of these is true: scout confidence is at or below the threshold; the scout says a vehicle is present but could not name it; the scout's `evidence` is empty. Do **not** escalate a clear not-a-vehicle answer. Re-tune the threshold on the test set and tell me the value and why.
- Apply the same pattern to parts: the part sniper receives the scout's answer. In the part prompt, replace "still respond with your best guess" with wording that keeps a best-guess part name but forbids a guessed vehicle or number, and give confidence the same kind of evidence-based scale.
- Product refinement (`refineProduct`): same verifier pattern, smaller priority. Do it if it is clean; otherwise leave it and say so.

### 3d. Structured output

Check whether the installed SDK supports JSON mode with a response schema for these models. If it does, use it on every call and keep the Zod validation as the safety net. Report how many "not JSON" failures the eval shows before and after.

### Done when (Task 3)

On the Task 2 test set, with today's models:

- **Invented vehicle above the threshold: zero** on the `no_vehicle` photos.
- Correct make and model on clear vehicles: no worse than baseline.
- Year covers truth: better than baseline, with fewer "too narrow".
- Invented part numbers: zero.
- Median and p90 end-to-end time: no worse than baseline. If the extra call makes it slower, show me the trade before merging.
- All existing tests pass, updated for the new call sequence, plus new tests for the escalation rule and the merge of the two calls.
- On a preview: one clear vehicle, the bumper-fragment photo and one part with a legible number all behave correctly. Give me the three `/r/{id}` links.

---

## Task 4: Reopen the model question (REPORT ONLY)

Only after Task 3 is merged and has run in production for a week without a rise in errors.

Run the Task 2 eval, with the new prompts and the full cascade, for these pairs:

| Scout | Sniper |
|---|---|
| `gemini-3.6-flash` | `gemini-3.1-pro-preview` (current) |
| `gemini-3.8-flash` | `gemini-3.1-pro-preview` |
| `gemini-3.6-flash` | `gemini-4-carbon` |
| `gemini-3.8-flash` | `gemini-4-carbon` |

Before running, check Google's model list and pricing page for anything newer or retired since Nov 12, 2026 and tell me if the table should change. For Gemini 4, test the default thinking level and MEDIUM; do not use LOW (the first eval showed it invents vehicles).

Report the same numbers as Task 2 per pair, plus cost per 1,000 analyses at the list price on the day. Recommend a pair, or recommend staying put. The reason to move is unchanged: `gemini-3.1-pro-preview` is capped at 250 requests a day on our tier and is a preview model that can be retired on short notice.

**STOP here and wait for my decision.**

---

## How we'll measure success

- **In the eval:** the Task 3 "done when" numbers hold on every later run. The test set becomes the gate for any future prompt or model change.
- **In production, four weeks after Task 3 ships** (exclude Nov 4 to 10, when analyses were down):
  - Timeouts: analyses ending in `error` with a timeout message, per week, before and after.
  - Sniper fallbacks: count of the fallback log line per week.
  - Escalation rate and share of vehicle analyses ending Unknown, before and after. A rise in Unknown is expected and acceptable if the eval shows those were wrong guesses before.
  - Affiliate click rate from results pages, from the part results funnel brief, to confirm honest Unknowns do not cost clicks overall.
