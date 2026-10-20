import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { merchants } from "@/lib/affiliate/merchants";
import { affiliateRouting, defaultMerchant } from "@/lib/affiliate/routing";
import { getServiceRoleClient } from "@/lib/supabase-server";
import { resolveSessionId, setSessionCookie } from "@/lib/session-cookie";
import { classifyClick, truncateHeader } from "@/lib/affiliate/click-filter";

/** PostgREST / Postgres codes for "that column doesn't exist yet". */
const MISSING_COLUMN_CODES = new Set(["PGRST204", "42703"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cat = searchParams.get("cat") || "";
  const vehicle = searchParams.get("vehicle") || "";
  const brand = searchParams.get("brand") || "";
  const product = searchParams.get("product") || "";
  const merchantQuery = searchParams.get("merchant");
  const source = searchParams.get("source") || "";

  // 1. Resolve merchant config
  let merchantKey = defaultMerchant;
  if (affiliateRouting[cat] && merchants[affiliateRouting[cat]]) {
    merchantKey = affiliateRouting[cat];
  } else if (merchantQuery && merchants[merchantQuery]) {
    merchantKey = merchantQuery;
  }

  // 2. Is this a real click on one of our pages? Bots and off-site requests
  //    still redirect, but untagged, and are logged with a filter_reason.
  const userAgent = req.headers.get("user-agent");
  const referer = req.headers.get("referer");
  const filterReason = classifyClick({
    userAgent,
    referer,
    requestHost: req.headers.get("host"),
  });

  // 3. Build destination URL
  const builder = merchants[merchantKey];
  const destinationUrl = builder({ cat, vehicle, brand, product, tagged: filterReason === null });

  const composedQuery = Array.from(new Set([vehicle, brand, product]
    .filter(Boolean)
    .join(" ")
    .split(/\s+/))).join(" ");

  // 4. Resolve session ID from cookie or generate a new one
  const { sessionId, isNew: isNewSession } = resolveSessionId(req);

  // 5. Log click asynchronously
  const logClick = async () => {
    try {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("[/go] SUPABASE_SERVICE_ROLE_KEY is missing. Affiliate click was NOT logged.", {
          merchant: merchantKey,
          category: cat,
          source,
        });
        return;
      }
      const supabase = getServiceRoleClient();
      const baseRow = {
        merchant: merchantKey,
        category: cat,
        vehicle,
        brand,
        product,
        composed_query: composedQuery,
        destination_url: destinationUrl,
        source,
        session_id: sessionId,
      };
      let { error } = await supabase.from("affiliate_clicks").insert({
        ...baseRow,
        user_agent: truncateHeader(userAgent),
        referer: truncateHeader(referer),
        filter_reason: filterReason,
      });

      // Until the 20261020000000 migration reaches a database, the new columns
      // don't exist. Keep logging real clicks the old way, and skip filtered
      // hits so they don't land in the table looking like real clicks.
      if (error && MISSING_COLUMN_CODES.has(error.code ?? "")) {
        if (filterReason !== null) return;
        ({ error } = await supabase.from("affiliate_clicks").insert(baseRow));
      }

      if (error) {
        console.error("[/go] Failed to insert affiliate click:", error.message, {
          merchant: merchantKey,
          category: cat,
          source,
        });
      }
    } catch (e) {
      console.error("[/go] Unexpected error logging affiliate click:", e);
    }
  };

  if (typeof after === "function") {
    after(logClick);
  } else {
    logClick().catch(console.error);
  }

  // 6. Redirect (always proceeds regardless of logging)
  const response = NextResponse.redirect(destinationUrl);

  // Set session cookie if new
  if (isNewSession) {
    setSessionCookie(response, sessionId);
  }

  return response;
}

