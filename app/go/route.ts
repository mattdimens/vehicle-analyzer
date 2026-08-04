import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { merchants } from "@/lib/affiliate/merchants";
import { affiliateRouting, defaultMerchant } from "@/lib/affiliate/routing";
import { getServiceRoleClient } from "@/lib/supabase-server";

const SESSION_COOKIE_NAME = "vf_sid";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

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

  // 2. Build destination URL
  const builder = merchants[merchantKey];
  const destinationUrl = builder({ cat, vehicle, brand, product });

  const composedQuery = Array.from(new Set([vehicle, brand, product]
    .filter(Boolean)
    .join(" ")
    .split(/\s+/))).join(" ");

  // 3. Resolve session ID from cookie or generate a new one
  let sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value || "";
  let isNewSession = false;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    isNewSession = true;
  }

  // 4. Log click asynchronously
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
      const { error } = await supabase.from("affiliate_clicks").insert({
        merchant: merchantKey,
        category: cat,
        vehicle,
        brand,
        product,
        composed_query: composedQuery,
        destination_url: destinationUrl,
        source,
        session_id: sessionId,
      } as any);

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

  // 5. Redirect (always proceeds regardless of logging)
  const response = NextResponse.redirect(destinationUrl);

  // Set session cookie if new
  if (isNewSession) {
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return response;
}

