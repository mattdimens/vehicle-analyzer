/**
 * Decides whether a /go request is a real click on one of our own pages.
 *
 * Real clicks get the affiliate tag and count as clicks in `affiliate_clicks`.
 * Everything else still redirects to the merchant (so a stray real visitor is
 * never stranded) but without the tag, and is logged with a `filter_reason`.
 *
 * Why: a crawler that ignores robots.txt was following the buy links on
 * /vehicles/* pages, about 95% of all /go hits (Oct 2026). Sending those to
 * Amazon with our tag inflates clicks against near-zero orders, which is the
 * pattern Amazon's invalid-traffic checks look for.
 *
 * Nov 2026: a nightly script (9 PM Pacific) sent about 140 clicks a night
 * with real-browser user agents and a forged Referer of exactly
 * "https://visualfitment.com". Browsers always send a path ("…com/" at
 * least), and every link on the site carries a `source`, so its requests had
 * a bare referer and no source. Amazon counted about 60 a night.
 */

export type ClickFilterReason = "bot_user_agent" | "no_referer" | "bare_referer" | "external_referer" | "no_source";

/** Hosts that count as "our pages" in addition to the host serving the request. */
const PRODUCTION_HOSTS = new Set(["visualfitment.com", "www.visualfitment.com"]);

/**
 * User agents that are automated: crawlers, scrapers, HTTP libraries,
 * headless browsers, link previewers and AI fetchers. Real browsers never
 * contain these tokens.
 */
const BOT_USER_AGENT =
  /bot\b|bot\/|crawl|spider|slurp|scrap|headless|phantomjs|puppeteer|playwright|selenium|python|curl\/|wget|httpclient|http-client|okhttp|axios|node-fetch|undici|go-http|java\/|libwww|scrapy|facebookexternalhit|embedly|lighthouse|pingdom|uptime|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|gptbot|chatgpt-user|claudebot|claude-user|perplexity|ccbot|amazonbot|applebot|bingpreview/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim();
  return ua === "" || BOT_USER_AGENT.test(ua);
}

/**
 * Returns null for a real click from our own pages, or the reason it was filtered.
 *
 * `requestHost` is the host that served /go (covers Vercel previews and
 * localhost). Our Referrer-Policy is strict-origin-when-cross-origin, so a
 * click from one of our pages always sends a same-origin Referer.
 */
export function classifyClick({
  userAgent,
  referer,
  requestHost,
  source,
}: {
  userAgent: string | null | undefined;
  referer: string | null | undefined;
  requestHost: string | null | undefined;
  /** The link's `source` param. Every link on the site sets one. */
  source: string | null | undefined;
}): ClickFilterReason | null {
  if (isBotUserAgent(userAgent)) return "bot_user_agent";
  if (!referer) return "no_referer";

  let refererHost: string;
  try {
    refererHost = new URL(referer).host.toLowerCase();
  } catch {
    return "external_referer";
  }

  // A browser's Referer always has a path after the host, even if only "/"
  if (!/^https?:\/\/[^/?#]+\//i.test(referer)) return "bare_referer";

  const host = (requestHost ?? "").toLowerCase();
  if (!PRODUCTION_HOSTS.has(refererHost) && !(host !== "" && refererHost === host)) {
    return "external_referer";
  }
  if (!(source ?? "").trim()) return "no_source";
  return null;
}

/** Trims a header value for storage so a hostile client can't send huge rows. */
export function truncateHeader(value: string | null | undefined, max = 500): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}
