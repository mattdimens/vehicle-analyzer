/**
 * When a failed analysis should email Matt. Pure, so it is unit-tested and
 * needs no table to remember past sends: the decision is replayed from the
 * failed `analyses` rows themselves.
 *
 * Rules (reliability brief, Task 1):
 * - An outage kind (billing, auth, model) emails on its first failure.
 * - Other failures email when 3 or more land within 60 minutes.
 * - At most one email per 6 hours for the same kind (outages) or for the
 *   "failures" group (everything else).
 *
 * Every failing pipeline replays the same history and sends only if the alert
 * lands on its own row, so two failures finishing at once don't both send.
 */
import { classifyAnalysisError, isOutageKind, type AnalysisErrorKind } from "./analysis-errors"

export const CLUSTER_WINDOW_MS = 60 * 60 * 1000
export const CLUSTER_SIZE = 3
export const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000
/** How far back to replay. Longer than the cooldown, so an earlier send is seen. */
export const ALERT_LOOKBACK_MS = 12 * 60 * 60 * 1000

export interface FailedAnalysis {
    id: string
    /** When the row became an error (updated_at), in ms. */
    at: number
    error_details: string | null
}

export interface ReplayedFailure extends FailedAnalysis {
    kind: AnalysisErrorKind
}

function groupFor(kind: AnalysisErrorKind): string {
    return isOutageKind(kind) ? kind : "failures"
}

/** Ids of the failures that send an email, replaying the rules in time order. */
export function failuresThatAlert(failures: FailedAnalysis[]): Set<string> {
    const events: ReplayedFailure[] = failures
        .map(f => ({ ...f, kind: classifyAnalysisError(f.error_details ?? "") }))
        .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))

    const lastSent = new Map<string, number>()
    const alerting = new Set<string>()

    events.forEach((event, i) => {
        const group = groupFor(event.kind)
        const previous = lastSent.get(group)
        if (previous !== undefined && event.at - previous < ALERT_COOLDOWN_MS) return

        let fires = isOutageKind(event.kind)
        if (!fires) {
            // Non-outage failures in the hour up to and including this one
            const inWindow = events
                .slice(0, i + 1)
                .filter(e => !isOutageKind(e.kind) && event.at - e.at < CLUSTER_WINDOW_MS)
            fires = inWindow.length >= CLUSTER_SIZE
        }
        if (fires) {
            lastSent.set(group, event.at)
            alerting.add(event.id)
        }
    })
    return alerting
}

/** The one-line next step for an alert email. */
export function alertAction(kind: AnalysisErrorKind): string {
    switch (kind) {
        case "billing":
            return "Check the Gemini balance at aistudio.google.com/billing."
        case "auth":
            return "Check the Gemini API key in Vercel environment variables."
        case "model":
            return "A Gemini model name may have been retired. Check SCOUT_MODEL and SNIPER_MODEL in lib/gemini.ts."
        default:
            return "Check Vercel Logs and search for 'pipeline error'."
    }
}

export function formatEastern(ms: number): string {
    return new Date(ms).toLocaleString("en-US", {
        timeZone: "America/New_York",
        dateStyle: "medium",
        timeStyle: "short",
    }) + " ET"
}

/** Subject and plain-text body for a failure alert. */
export function failureAlertEmail({
    kind,
    failuresLastHour,
    latestError,
    at,
}: {
    kind: AnalysisErrorKind
    failuresLastHour: number
    latestError: string | null
    at: number
}): { subject: string; text: string } {
    const outage = isOutageKind(kind)
    return {
        subject: `VisualFitment: analyses failing (${kind})`,
        text: [
            outage
                ? "Every analysis will fail until this is fixed."
                : `${failuresLastHour} analyses failed in the last hour.`,
            "",
            `Kind: ${kind}`,
            `Failures in the last hour: ${failuresLastHour}`,
            `Time: ${formatEastern(at)}`,
            `Latest error: ${(latestError ?? "(none recorded)").slice(0, 300)}`,
            "",
            `What to do: ${alertAction(kind)}`,
            "",
            "You'll get at most one of these every 6 hours for the same problem.",
        ].join("\n"),
    }
}

/** Subject and body for the daily check, or null when the day looks healthy. */
export function dailyHealthEmail({
    started,
    completed,
    failed,
    latestError,
}: {
    started: number
    completed: number
    failed: number
    latestError: string | null
}): { subject: string; text: string } | null {
    if (started > 0 && completed > 0) return null
    const kind = latestError ? classifyAnalysisError(latestError) : null
    const headline = started === 0
        ? "No analyses were started in the last 24 hours."
        : "No analyses finished in the last 24 hours."
    return {
        subject: started === 0
            ? "VisualFitment: no analyses started in 24 hours"
            : "VisualFitment: no analyses finished in 24 hours",
        text: [
            headline,
            "",
            `Started: ${started}`,
            `Finished: ${completed}`,
            `Failed: ${failed}`,
            ...(latestError ? [`Latest error (${kind}): ${latestError.slice(0, 300)}`] : []),
            "",
            started === 0
                ? "What to do: try an upload on visualfitment.com/part-identifier. If it works, traffic may just be low; if not, check Vercel Logs."
                : `What to do: ${alertAction(kind ?? "unknown")}`,
        ].join("\n"),
    }
}
