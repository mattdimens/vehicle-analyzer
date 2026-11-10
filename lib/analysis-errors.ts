/**
 * Sorts a failed analysis into a kind, so visitors see copy that matches the
 * cause and logs can be searched by kind.
 *
 * Pure and dependency-free: the server uses it on thrown errors, and the
 * client uses it on a record's stored `error_details` (the thrown message).
 *
 * Why: from about 2026-11-04 to 11-10 the Gemini account was switched to
 * prepay with a $0 balance, so every analysis failed with a 402. Visitors were
 * told nothing useful, and retrying could never have worked.
 */

export type AnalysisErrorKind =
    | "billing"
    | "auth"
    | "model"
    | "quota"
    | "timeout"
    | "bad_output"
    | "unknown"

/** Every visitor fails until someone fixes the account, key or model name. */
export const OUTAGE_KINDS: ReadonlySet<AnalysisErrorKind> = new Set(["billing", "auth", "model"])

export function isOutageKind(kind: AnalysisErrorKind): boolean {
    return OUTAGE_KINDS.has(kind)
}

const BILLING = /prepay|prepayment|credits are depleted|billing/i
const AUTH = /api key not valid|api_key_invalid|invalid api key|permission_denied|unauthenticated|GEMINI_API_KEY is not set/i
const MODEL = /models\/[\w.-]+ is not found|model[^.]{0,40}not found|not found for api version|is not supported for generatecontent|has been deprecated|no longer available/i
const QUOTA = /resource_exhausted|rate limit|too many requests|quota/i
const TIMEOUT = /timed out|timeout|deadline_exceeded|aborterror|aborted/i
const BAD_OUTPUT = /unexpected response format/i

/** An HTTP status on the error object, or the first "code": NNN in its message (Gemini puts its JSON there). */
function statusOf(err: unknown, message: string): number | null {
    const status = (err as { status?: unknown } | null)?.status
    if (typeof status === "number") return status
    const match = message.match(/"code"\s*:\s*(\d{3})\b/)
    return match ? Number(match[1]) : null
}

function messageOf(err: unknown): string {
    if (err instanceof Error) return err.message
    if (typeof err === "string") return err
    return ""
}

export function classifyAnalysisError(err: unknown): AnalysisErrorKind {
    const message = messageOf(err)
    const status = statusOf(err, message)

    // Billing first: Google sometimes sends the prepay message with a 429
    if (status === 402 || BILLING.test(message)) return "billing"
    if (status === 401 || status === 403 || AUTH.test(message)) return "auth"
    if (status === 404 || MODEL.test(message)) return "model"
    if (status === 429 || QUOTA.test(message)) return "quota"
    if (status === 504 || TIMEOUT.test(message)) return "timeout"
    if (BAD_OUTPUT.test(message)) return "bad_output"
    return "unknown"
}

/** The line shown under "Try again" on a failed analysis. */
export function analysisErrorCopy(kind: AnalysisErrorKind): string {
    switch (kind) {
        case "billing":
        case "auth":
        case "model":
            return "Our identifier is down right now. We're on it. Please check back later today."
        case "quota":
            return "Too many requests. Please wait a minute and try again."
        case "timeout":
            return "That took too long. Try again, or try a clearer photo."
        case "bad_output":
        case "unknown":
            return "Something went wrong on our side. Try again in a minute."
    }
}

/** HTTP status for an API route that failed with this kind. */
export function analysisErrorStatus(kind: AnalysisErrorKind): number {
    return isOutageKind(kind) ? 503 : 502
}

/**
 * The message an API route returns for a failed analysis: the kind's copy when
 * the cause is known (outage, rate limit, timeout), otherwise the route's own
 * fallback. Never the raw provider message.
 */
export function publicAnalysisError(err: unknown, fallback: string): string {
    const kind = classifyAnalysisError(err)
    return kind === "bad_output" || kind === "unknown" ? fallback : analysisErrorCopy(kind)
}
