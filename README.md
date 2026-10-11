# VisualFitment.com

Upload a photo of a vehicle (or a loose part) and get its year/make/model, visible aftermarket products, and compatible accessories with Amazon affiliate links.

Stack: Next.js (App Router) on Vercel, Supabase (Postgres, storage, Google auth), Google Gemini, GA4.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

All environment variables are documented in [.env.example](.env.example). Set the same ones in Vercel.

## How it fits together

- **Homepage photo flow:** `components/home/hero-dual-entry.tsx` uploads to the `vehicle_images` bucket, `POST /api/analyses` creates a row, and `lib/pipeline.ts` runs in the background (`waitUntil`). `/r/[id]` polls `GET /api/analyses/[id]`.
- **Category pages and part identifier:** `components/home/vehicle-analyzer.tsx` calls `POST /api/analyze` plus the Server Actions in `app/actions.ts`.
- **Gemini stages:** `lib/analysis-stages.ts` (server-only). Each stage runs a Flash "scout" pass and escalates to the Pro "sniper" model at or below `CASCADE_CONFIDENCE_THRESHOLD` (`lib/gemini.ts`). Anything browser-callable must validate image URLs with `lib/url-validation.ts` first.
- **Affiliate links:** every outbound product link goes through `/go` (`app/go/route.ts`), which logs to `affiliate_clicks` and redirects using `lib/affiliate/merchants.ts`. Links use `target="_blank" rel="nofollow sponsored noopener"`.
- **Vehicle catalog:** `data/vehicles/` drives `/vehicles/*` and the sitemap.
- **Blog:** MDX in `content/blog/`, rendered by `app/blog/[slug]/page.tsx`.

## Database schema

`supabase/migrations/` holds the schema and RLS policies (a `pg_dump` of the `public` schema), plus the `auth.users` signup trigger and the `vehicle_images` bucket. After a schema change, refresh the dump and the generated types:

```bash
/opt/homebrew/opt/libpq/bin/pg_dump "postgresql://postgres.jktvsbtgwtzsszebzyay@aws-1-us-east-2.pooler.supabase.com:5432/postgres" --schema-only --schema=public --no-owner --no-privileges -f supabase/migrations/<timestamp>_remote_schema.sql
supabase gen types typescript --project-id jktvsbtgwtzsszebzyay --schema public > types/supabase.ts
```

`pg_dump` prompts for the database password (Supabase: Database → Settings). Delete the `\restrict` and `\unrestrict` lines it adds (they are psql commands, and `supabase db push` rejects them). Re-append the convenience types at the bottom of `types/supabase.ts` after regenerating.

### Dev project

`visualfitment-dev` (`svkwgklyyqmwpcrgdjja`) is a separate Supabase project with the same schema and no real data. Cloud sessions use it. To apply new migrations to it:

```bash
supabase link --project-ref svkwgklyyqmwpcrgdjja
supabase db push
```

Check `supabase/.temp/project-ref` before running `db push`, so you know which project it targets.

## Checks

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

The latest audit is in [REVIEW.md](REVIEW.md).
