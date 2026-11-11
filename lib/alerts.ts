/**
 * Failure alert emails (reliability brief, Task 1). Server-only: it reads the
 * Resend API key and uses the service-role Supabase client.
 *
 * Nothing here ever throws: a failed alert is logged and dropped, so it can't
 * fail or slow down an analysis.
 *
 * Environment (Vercel, Production and Preview):
 * - RESEND_API_KEY  the Resend key (Sending access is enough)
 * - ALERT_EMAIL     where alerts go. Until a domain is verified in Resend, this
 *                   must be the email the Resend account was created with.
 * - ALERT_FROM      optional sender; defaults to Resend's test sender.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { classifyAnalysisError } from "./analysis-errors"
import {
    ALERT_LOOKBACK_MS,
    CLUSTER_WINDOW_MS,
    failureAlertEmail,
    failuresThatAlert,
    type FailedAnalysis,
} from "./alert-rules"

const DEFAULT_FROM = "VisualFitment alerts <onboarding@resend.dev>"

export async function sendAlertEmail({ subject, text }: { subject: string; text: string }): Promise<{ sent: boolean; reason?: string }> {
    const apiKey = process.env.RESEND_API_KEY
    const to = process.env.ALERT_EMAIL
    if (!apiKey || !to) {
        console.warn("[alerts] RESEND_API_KEY or ALERT_EMAIL is not set; alert not sent:", subject)
        return { sent: false, reason: "not configured" }
    }
    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: process.env.ALERT_FROM || DEFAULT_FROM, to: [to], subject, text }),
            signal: AbortSignal.timeout(10_000),
        })
        if (!res.ok) {
            const body = await res.text().catch(() => "")
            console.error("[alerts] Resend refused the alert:", res.status, body.slice(0, 300))
            return { sent: false, reason: `resend ${res.status}` }
        }
        console.log("[alerts] sent:", subject)
        return { sent: true }
    } catch (err) {
        console.error("[alerts] could not send the alert:", err)
        return { sent: false, reason: "send failed" }
    }
}

/**
 * Call after a pipeline marks an analysis as `error`. Replays recent failures
 * and emails only when the rules say this failure is the one that alerts.
 */
export async function notifyAnalysisFailure(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    try {
        const since = new Date(Date.now() - ALERT_LOOKBACK_MS).toISOString()
        const { data, error } = await supabase
            .from("analyses")
            .select("id, error_details, updated_at")
            .eq("status", "error")
            .gte("updated_at", since)
            .order("updated_at", { ascending: true })
            .limit(1000)
        if (error || !data) {
            console.error("[alerts] could not read recent failures:", error?.message)
            return
        }

        const failures: FailedAnalysis[] = data.map(row => ({
            id: row.id,
            at: Date.parse(row.updated_at),
            error_details: row.error_details,
        }))
        if (!failuresThatAlert(failures).has(id)) return

        const current = failures.find(f => f.id === id)
        if (!current) return
        const failuresLastHour = failures.filter(f => current.at - f.at < CLUSTER_WINDOW_MS && f.at <= current.at).length

        await sendAlertEmail(failureAlertEmail({
            kind: classifyAnalysisError(current.error_details ?? ""),
            failuresLastHour,
            latestError: current.error_details,
            at: current.at,
        }))
    } catch (err) {
        console.error("[alerts] failure alert check crashed:", err)
    }
}
