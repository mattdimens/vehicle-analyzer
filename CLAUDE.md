# VisualFitment.com

@README.md

## Working in this repo

- Package manager is npm (`package-lock.json`). Vercel builds with Node 22.x, so don't rely on newer Node APIs.
- Before opening a PR, run the checks in the README: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.
- Work on a branch and open a PR against `main`. Vercel builds a preview deploy for every PR; use it to check changes that need real data.

## Secrets and environment

- Secrets are not in the repo. Production and preview values live in Vercel (Project → Settings → Environment Variables). Locally they are in `.env.local`, which is gitignored. `.env.example` lists every variable.
- `npx tsc --noEmit`, `npm run lint` and `npm test` need no environment variables. Running the app with real Supabase and Gemini calls does.
- In a cloud session without secrets, don't try to run live analyses or query Supabase. Rely on the tests and the Vercel preview.
- Never prefix a server-only secret with `NEXT_PUBLIC_`. `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must stay server-side.

## Rules that are easy to break

- Any browser-callable path that takes an image URL must validate it with `lib/url-validation.ts` first.
- Every outbound product link goes through `/go` with `target="_blank" rel="nofollow sponsored noopener"`. Don't link to Amazon directly; tags live in `lib/affiliate/merchants.ts`.
- `lib/analysis-stages.ts` is server-only. Don't import it from client components.
- Schema changes go in `supabase/migrations/` and need `types/supabase.ts` regenerated (see README).
