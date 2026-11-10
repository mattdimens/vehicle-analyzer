# VisualFitment: Reliability Brief (Nov 2026)

**For:** Claude Code, working in the `vehicle-analyzer` repo (GitHub: `mattdimens/vehicle-analyzer`)
**From:** Matt (founder). I am not a developer. Explain anything I need to do myself in plain steps.
**Design reference:** none. Copy is given below; use it as written.

---

## What happened (context)

From about Nov 4 to Nov 10, 2026, every part and vehicle analysis on the live site failed. Google moved the Gemini API account from postpay to prepay with a $0 balance, so every call returned:

```
Part pipeline error for {id} Error [ApiError]: {"error":{"code":402,"message":"Your prepayment credits are depleted. ..."}}
```

Visitors saw "Too many requests. Please wait a minute and try again." on the `/r/[id]` error screen, which was wrong: waiting would never have helped. Nobody was told. I found it six days later, only because Amazon affiliate clicks fell to almost zero (Supabase `affiliate_clicks`: 6 to 15 real clicks a day through Nov 3, then 1, 1, 0, nothing).

The billing is fixed (credits bought, auto-reload on). This brief makes sure a failure like this is visible to me within the hour and honest to visitors.

Separately, a bot is generating fake Amazon clicks: Nov 8 logged 143 unfiltered clicks from 143 different sessions; Nov 9 logged exactly 143 more, all filtered. Amazon counted about 60 a day on both days, so filtering in our log does not stop Amazon counting them.

---

## How to work through this brief

1. **Explore before changing.** Read the files named in each task, tell me what you found and what you plan to change, then build. If anything here conflicts with what the code does, stop and tell me.
2. **Tasks 3 and 4 start READ-ONLY.** Report findings and a proposed fix, then wait for my approval.
3. **One branch and one PR per task.** Suggested branches: `feat/failure-alerts`, `fix/analysis-error-copy`, `fix/go-bot-clicks`.
4. **Before every PR run:** `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`. All must pass.
5. When each task is done, give me a two to three line summary: what changed, which files, and how I can check it on the Vercel preview.

---

## Guardrails (apply to every task)

**Do not change:**
- Any URL, slug or route.
- Existing GA4 event names or their existing parameters: `photo_analysis_started`, `analysis_completed`, `part_identification_completed`, `ymm_selector_submitted`, `browse_by_vehicle_click`, `affiliate_click`, `save_part`, `results_catalog_click`, `sample_result_click`, `analysis_wait_slow`, `vehicle_fit_selected`, `vehicle_year_selected`. `entry_door` must keep flowing.
- What a real visitor experiences when they click a shop link: `/go` must still redirect them to Amazon with our tag, in a new tab, and log the click exactly as today.
- Existing `source` values, `lib/affiliate/*` link building, or the columns in `affiliate_clicks`.
- The polling interval, the 2-minute stale rule, or retry behavior on `/r/[id]`.
- Supabase RLS. **Ask before any migration.** If one turns out to be necessary, follow `CLAUDE.md` (new file in `supabase/migrations/`, regenerated types, dev first, production only after I say so).
- No new Gemini calls.

**Secrets:** never put an email address, API key or IP list in code. Use environment variables and tell me exactly which ones to add in Vercel (Project > Settings > Environment Variables) and for which environments.

**Copy rules:** no em dashes; no AI-focused language; never use a call to action as a heading.

---

## Task 1: Tell me when analyses are failing

**Files to read first:** `lib/pipeline.ts` (`runPipeline`, `runPartPipeline`, their catch blocks), `lib/analysis-stages.ts`, `app/api/analyses/route.ts`, `app/api/analyses/[id]/process/route.ts`, `app/api/analyze/part/route.ts`, `vercel.json` (if present), and anything that already sends email (search for `resend`, `nodemailer`, `sendgrid`, `postmark`).

### 1a. Classify the error

Add one pure, unit-tested helper (e.g. `classifyAnalysisError(err)` in `lib/analysis-errors.ts`) that turns a thrown error into one of:

| Kind | When |
|---|---|
| `billing` | HTTP 402, or a message containing "prepayment" or "billing" |
| `auth` | HTTP 401 or 403, or an invalid or missing API key |
| `model` | HTTP 404 on the model, or "model not found" / deprecated |
| `quota` | HTTP 429 or `RESOURCE_EXHAUSTED` that is **not** billing (note: Google sometimes returns the prepay message as 429, so check the message before the status) |
| `timeout` | our own timeout or an aborted request |
| `bad_output` | the model replied but the response failed Zod validation |
| `unknown` | anything else |

`billing`, `auth` and `model` are **site-wide outages**: every visitor will fail until I act. The rest may be one-offs.

Use it in both pipelines' catch blocks and in `/api/analyze/part`. Log the kind with the existing error log line (e.g. `Part pipeline error [billing] for {id}`) so I can search Vercel logs by kind.

Tell me whether the `analyses` table already stores an error message or reason. If it does, store the kind there too. If it doesn't, don't add a column without asking me.

### 1b. Send me an email

- **Immediately** on the first `billing`, `auth` or `model` error.
- **Otherwise** when 3 or more analyses have failed in the last 60 minutes (count from `analyses` where `status = 'error'`).
- **At most one email every 6 hours** for the same kind, so an outage doesn't flood my inbox. Pick the simplest way to remember the last send that works across serverless instances (a small Supabase table needs a migration, so ask first; propose alternatives if there are any).
- Sending an alert must never slow down or fail the visitor's request: fire it without awaiting the visitor's response path, and swallow and log any send error.
- **Content:** subject "VisualFitment: analyses failing ({kind})". Body: the kind, how many failures in the last hour, the most recent raw error message (first 300 characters), the time in Eastern, and one line on what to do:
  - `billing`: "Check the Gemini balance at aistudio.google.com/billing."
  - `auth`: "Check the Gemini API key in Vercel environment variables."
  - `model`: "A Gemini model name may have been retired. Check lib/analysis-stages.ts."
  - Others: "Check Vercel Logs and search for 'pipeline error'."

If nothing in the repo sends email yet, recommend a provider with a free tier (Resend is fine), and give me exact steps to create the account, verify a sender, and add the API key plus `ALERT_EMAIL` to Vercel. Add a way for me to trigger a test alert on a preview deployment only (never in production), and tell me how to use it.

### 1c. Daily safety net

A Vercel cron job once a day (Hobby allows daily crons; confirm) that emails me if there were **zero** completed analyses in the last 24 hours while there were started ones, or zero started at all. That catches failures that never reach a catch block. Protect the cron route with Vercel's `CRON_SECRET` pattern.

### Done when (Task 1)

- `classifyAnalysisError` has unit tests for each kind, including a 429 that carries the prepayment message (must be `billing`).
- On a preview deployment, the test trigger sends me an email that arrives.
- A simulated `billing` error (in a test, never production) sends one email; a second one within 6 hours sends none.
- The visitor-facing request is no slower (no awaited email call on its path).

---

## Task 2: Honest error messages for visitors

**Files to read first:** `components/analysis/analysis-view.tsx` (error branches), wherever the "Too many requests. Please wait a minute and try again." string is set (search for it), `app/api/analyses/[id]/route.ts`.

The `/r/[id]` error screen should show copy that matches the cause. Keep the H1 "That identification didn't finish.", the "Try again" button and the "Back to the part identifier" link exactly as they are. Change only the red line under the button:

| Kind | Line |
|---|---|
| `billing`, `auth`, `model` | Our identifier is down right now. We're on it. Please check back later today. |
| `quota` (real rate limit) | Too many requests. Please wait a minute and try again. (unchanged) |
| `timeout` | That took too long. Try again, or try a clearer photo. |
| `bad_output`, `unknown` | Something went wrong on our side. Try again in a minute. |

For the outage kinds, keep "Try again" visible (it will work as soon as the outage is fixed).

The client needs the kind. If the record stores it (Task 1a), read it from there. If it doesn't, tell me the options before adding anything. Apply the same mapping to the vehicle error screen and to the homepage and category-page inline errors if they show the same string.

### Done when (Task 2)

- Each kind shows its line on a preview (simulate in a test or by forcing the kind locally, never on production).
- The copy is exactly as written above.

---

## Task 3: Stop the bot from creating Amazon clicks (START READ-ONLY)

**Files to read first:** `app/go/route.ts`, `lib/affiliate/*`, the code that sets `filter_reason`, `public/robots.txt` or `app/robots.ts`, `middleware.ts` (if present), any Vercel Firewall config in the repo.

### Investigate and report

1. Explain how `filter_reason` is decided today, every value it can take, and whether a flagged click is still redirected to Amazon (I believe it is).
2. Explain why the Nov 8 burst (143 clicks, 143 sessions, 0 filtered) passed the filter and the Nov 9 burst (143 clicks, all filtered) didn't. Was there a deploy between them?
3. Write read-only SQL I can run in the Supabase SQL editor (production) that profiles Nov 8 and Nov 9 (Pacific time): count by `source`, by `filter_reason`, by hour, by the columns that identify a visitor (user agent, IP or hashed IP, referrer, country, whatever `affiliate_clicks` stores), and how many distinct `/go` destinations (cat, product, asin) were hit. Tell me what each result would tell us. I'll run it and send you the output.
4. Check whether `robots.txt` disallows `/go` and whether `/go` responses send `X-Robots-Tag: noindex, nofollow`.

### Then propose (wait for approval)

The smallest change that keeps bot traffic from reaching Amazon while every real visitor still redirects. Likely pieces:
- `Disallow: /go` in robots.txt and `X-Robots-Tag: noindex, nofollow` on `/go` responses.
- For requests the filter already flags as bots, respond without redirecting to Amazon (e.g. a plain 200 page with a normal link to Amazon, or a 403), still logging the click with its `filter_reason`.
- Tightening the filter so a burst like Nov 8 is caught on the first day.

List the risk to real visitors for each piece (for example, a false positive on a real phone browser). A real visitor must never be blocked from reaching Amazon.

---

## Task 4: Why Amazon showed no clicks before Oct 15 (READ-ONLY)

Amazon Associates reports zero clicks from Aug through Oct 14, 2026, then clicks from Oct 15 onward. GA4 recorded `affiliate_click` events throughout, and Supabase `affiliate_clicks` has rows from August.

Check git history for anything around Oct 10 to 15 that touched the Amazon tag (`visualfitme0b-20`), the tag's environment variable, `lib/affiliate/*` or `app/go/route.ts`. Tell me what the tag was before and after, and whether August to mid-October links carried a working tag. Report only.

---

## How we'll measure success

**Measurement note for every other brief:** analyses failed site-wide from about Nov 4 to Nov 10, 2026. Exclude those dates from any before/after comparison (part results funnel, upload card, loading screen, vehicle pages, light theme).

Four weeks after Tasks 1 to 3 ship:
- **Alerting:** any real failure produces an email within the hour. Track the number of alerts and whether each was real.
- **Bot clicks:** Amazon's daily click count stays within about 20% of Supabase unfiltered clicks for the same Pacific day, with no single-day spikes above 3x the trailing average.
- **Completion rate:** analyses `complete` divided by all analyses, by kind:

```sql
select (created_at at time zone 'America/Los_Angeles')::date as day_pt,
       kind,
       count(*) filter (where status = 'complete') as complete,
       count(*) filter (where status = 'error')    as error,
       count(*)                                    as total
from analyses
where created_at >= '2026-11-11'
group by 1, 2
order by 1, 2;
```
