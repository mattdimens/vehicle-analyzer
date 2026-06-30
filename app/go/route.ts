import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { merchants } from "@/lib/affiliate/merchants";
import { affiliateRouting, defaultMerchant } from "@/lib/affiliate/routing";
import { getServiceRoleClient } from "@/lib/supabase-server";

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

  // 3. Log click asynchronously
  const logClick = async () => {
    try {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
      const supabase = getServiceRoleClient();
      await supabase.from("affiliate_clicks").insert({
        merchant: merchantKey,
        category: cat,
        vehicle,
        brand,
        product,
        composed_query: composedQuery,
        destination_url: destinationUrl,
        source
      } as any);
    } catch (e) {
      console.error("Failed to log affiliate click", e);
    }
  };

  if (typeof after === "function") {
    after(logClick);
  } else {
    logClick().catch(console.error);
  }

  // 4. Redirect
  return NextResponse.redirect(destinationUrl);
}
