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

## Checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

The latest audit is in [REVIEW.md](REVIEW.md).
