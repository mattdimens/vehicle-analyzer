# VisualFitment.com

@README.md

## Working in this repo

- Package manager is npm (`package-lock.json`). Vercel builds with Node 22.x, so don't rely on newer Node APIs.
- Before opening a PR, run the checks in the README: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.
- Work on a branch and open a PR against `main`. Vercel builds a preview deploy for every PR; use it to check changes that need real data.

## Secrets and environment

- Secrets are not in the repo. Production and preview values live in Vercel (Project → Settings → Environment Variables). Locally they are in `.env.local`, which is gitignored. `.env.example` lists every variable.
- `npx tsc --noEmit`, `npm run lint` and `npm test` need no environment variables. Running the app with real Supabase and Gemini calls does.
- Never prefix a server-only secret with `NEXT_PUBLIC_`. `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must stay server-side.

## Cloud sessions

The cloud environment is set up like this:

- **Network:** Custom, with the default allowlist plus `*.supabase.co`.
- **Gemini:** the key is a network secret, so it never enters the session. `GEMINI_API_KEY` holds a placeholder, and the proxy swaps in the real key on requests to `generativelanguage.googleapis.com`, so live Gemini calls work. They cost money: only make them when the task needs it.
- **Supabase:** the three Supabase variables point at the dev project `visualfitment-dev` (`svkwgklyyqmwpcrgdjja`), not production. It has the same schema and no real data, so the full photo-analysis flow can run. Never put production Supabase keys in the cloud environment.
- When the app can't run end to end, use the tests and the Vercel preview deploy.

## Rules that are easy to break

- Any browser-callable path that takes an image URL must validate it with `lib/url-validation.ts` first.
- Every outbound product link goes through `/go` with `target="_blank" rel="nofollow sponsored noopener"`. Don't link to Amazon directly; tags live in `lib/affiliate/merchants.ts`.
- `lib/analysis-stages.ts` is server-only. Don't import it from client components.
- Every database change (tables, columns, policies, functions, triggers, buckets) goes in a new file in `supabase/migrations/`, and `types/supabase.ts` gets regenerated (see README). Never tell the user to make the change in the Supabase dashboard.
- There are two Supabase projects, production (`jktvsbtgwtzsszebzyay`) and dev (`svkwgklyyqmwpcrgdjja`), and their schemas must stay identical. When you add a migration:
  - Apply it to dev (`supabase link --project-ref svkwgklyyqmwpcrgdjja`, then `supabase db push`). Check `supabase/.temp/project-ref` first.
  - Apply it to production only after the user explicitly says so, after it has been merged.
  - If you can't apply it (cloud sessions have no Supabase CLI login), say so at the top of the PR description and in your final message, naming which project still needs it.
