import { NextResponse } from "next/server"
import { refreshAmazonItems } from "@/lib/amazon/refresh"

/**
 * Vercel Cron (vercel.json, daily at 10:00 UTC: the Hobby plan allows one run
 * a day): refreshes the amazon_items cache for every active catalog ASIN.  Vercel sends `Authorization: Bearer $CRON_SECRET`;
 * anything else is refused, so nobody else can spend the API quota.
 */
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await refreshAmazonItems()
  if (!result.ok) console.error("amazon-items refresh failed:", result.reason)
  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
