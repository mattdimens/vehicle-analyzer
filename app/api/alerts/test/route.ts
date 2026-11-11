import { NextResponse } from "next/server"
import { sendAlertEmail } from "@/lib/alerts"
import { failureAlertEmail } from "@/lib/alert-rules"

/**
 * Sends a sample failure alert so Matt can check the email setup. Preview
 * deployments and local dev only: production always answers 404, so nobody
 * can use it to send email.
 */
export const dynamic = "force-dynamic"

export async function GET() {
  const env = process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "development" ? "development" : "production")
  if (env === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const email = failureAlertEmail({
    kind: "billing",
    failuresLastHour: 1,
    latestError: "TEST ALERT from a preview deployment. Nothing is broken.",
    at: Date.now(),
  })
  const result = await sendAlertEmail({ ...email, subject: `[TEST] ${email.subject}` })
  return NextResponse.json(result, { status: result.sent ? 200 : 500 })
}
