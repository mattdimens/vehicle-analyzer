-- Record who made each /go hit, and why it was filtered (if it was).
--
-- filter_reason is NULL for a real click on one of our pages. Otherwise it is
-- 'bot_user_agent', 'no_referer' or 'external_referer', and the visitor was
-- redirected without the affiliate tag. Count real clicks with:
--   select count(*) from affiliate_clicks where filter_reason is null;
--
-- Rows from before this migration have all three columns NULL, so they look
-- like real clicks even though most were crawler traffic (Oct 2026 finding).

ALTER TABLE public.affiliate_clicks
    ADD COLUMN IF NOT EXISTS user_agent text,
    ADD COLUMN IF NOT EXISTS referer text,
    ADD COLUMN IF NOT EXISTS filter_reason text;
