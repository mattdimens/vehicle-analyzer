import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/pipeline"
import { sendAlertEmail } from "@/lib/alerts"
import { dailyHealthEmail } from "@/lib/alert-rules"

/**
 * Vercel Cron (vercel.json, daily at 12:00 UTC, about 7 AM Eastern; Hobby
 * allows one run a day per job): emails Matt when no analysis was started,
 * or none finished, in the last 24 hours. Catches failures that never reach
 * a pipeline's catch block. Vercel sends `Authorization: Bearer $CRON_SECRET`;
 * anything else is refused.
 */
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const count = (status?: string) => {
    let query = supabase.from("analyses").select("id", { count: "exact", head: true }).gte("created_at", since)
    if (status) query = query.eq("status", status)
    return query
  }

  const [all, complete, failed, latest] = await Promise.all([
    count(),
    count("complete"),
    count("error"),
    supabase
      .from("analyses")
      .select("error_details")
      .eq("status", "error")
      .gte("created_at", since)
      .order("updated_at", { ascending: false })
      .limit(1),
  ])

  const queryError = all.error ?? complete.error ?? failed.error ?? latest.error
  if (queryError) {
    console.error("analysis-health: query failed:", queryError.message)
    await sendAlertEmail({
      subject: "VisualFitment: daily check could not read analyses",
      text: `The daily health check couldn't query Supabase:\n\n${queryError.message.slice(0, 300)}\n\nWhat to do: check Vercel Logs for /api/cron/analysis-health.`,
    })
    return NextResponse.json({ ok: false, reason: "query failed" }, { status: 502 })
  }

  const summary = {
    started: all.count ?? 0,
    completed: complete.count ?? 0,
    failed: failed.count ?? 0,
    latestError: latest.data?.[0]?.error_details ?? null,
  }
  const email = dailyHealthEmail(summary)
  const result = email ? await sendAlertEmail(email) : { sent: false, reason: "healthy" }
  return NextResponse.json({ ok: true, ...summary, latestError: undefined, alert: result })
}
