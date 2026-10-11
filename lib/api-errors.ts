/**
 * Turn a failed API response into a message that is safe to show users.
 *
 * Vercel's firewall answers rate-limited requests itself with 403/429 and a
 * body like {"error":{"code":"403",...}}, so `error` is not always a string.
 */
export const RATE_LIMIT_MESSAGE = "Too many requests. Please wait a minute and try again."

/** Server Actions blocked by the firewall surface as this generic Next.js error. */
const SERVER_ACTION_FAILURE = /unexpected response was received from the server/i

export function apiErrorMessage(status: number, body: unknown, fallback: string): string {
    if (status === 403 || status === 429) return RATE_LIMIT_MESSAGE
    const error = (body as { error?: unknown } | null)?.error
    return typeof error === "string" && error ? error : fallback
}

/** Read a fetch Response's JSON body without throwing on HTML or empty bodies. */
export async function readJson(res: Response): Promise<Record<string, unknown>> {
    return res.json().catch(() => ({}))
}

/** Normalize a thrown error (including failed Server Action calls) for display. */
export function thrownErrorMessage(err: unknown, fallback: string): string {
    const message = err instanceof Error ? err.message : typeof err === "string" ? err : ""
    if (SERVER_ACTION_FAILURE.test(message)) {
        return "We couldn't reach the server. If you've run several analyses in a row, wait a minute and try again."
    }
    return message || fallback
}
