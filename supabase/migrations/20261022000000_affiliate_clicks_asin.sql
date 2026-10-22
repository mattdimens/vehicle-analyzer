-- Which Amazon product a /go click went to, for catalog product links.
--
-- NULL for search links (everything from before this migration, the photo
-- results, the blog and the placeholder vehicle-page products). A catalog
-- product that has been retired still logs its ASIN, but destination_url
-- shows the click was sent to a search instead. Clicks per product:
--   select asin, count(*) from affiliate_clicks
--   where asin is not null and filter_reason is null group by asin;

ALTER TABLE public.affiliate_clicks
    ADD COLUMN IF NOT EXISTS asin text;
