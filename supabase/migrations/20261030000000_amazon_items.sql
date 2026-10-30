-- Cache of Amazon listing data for catalog products, from the Creators API.
--
-- A Vercel Cron job (/api/cron/amazon-items) refreshes every active catalog
-- ASIN; vehicle pages read the cache when they're regenerated.  Pages hide
-- price, image and stock once fetched_at is more than 24 hours old, so a
-- stalled refresh, or lost API access, falls back to the editorial card.
-- Plan: docs/vehicle-pages-plan.md, sections 6.4 and 8.3.
--
-- image_url is Amazon's own image link, never a stored copy.

CREATE TABLE IF NOT EXISTS public.amazon_items (
    asin text PRIMARY KEY,
    -- ok: in stock with a price; unavailable: listed but no offer; not_found: Amazon returned nothing
    status text NOT NULL CHECK (status IN ('ok', 'unavailable', 'not_found')),
    title text,
    brand text,
    image_url text,
    price_amount numeric(10, 2),
    price_display text,
    currency text,
    availability text,
    availability_message text,
    merchant text,
    detail_page_url text,
    fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.amazon_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read (the pages read with the anon key).  Only the service role
-- writes, and it bypasses RLS, so there are no write policies.
DROP POLICY IF EXISTS "amazon_items are readable by everyone" ON public.amazon_items;
CREATE POLICY "amazon_items are readable by everyone"
    ON public.amazon_items
    FOR SELECT
    TO anon, authenticated
    USING (true);
