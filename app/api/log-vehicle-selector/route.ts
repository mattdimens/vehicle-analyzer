import { NextRequest, NextResponse } from "next/server"
import { getServiceRoleClient } from "@/lib/supabase-server"
import { resolveSessionId, setSessionCookie } from "@/lib/session-cookie"

/**
 * POST /api/log-vehicle-selector
 *
 * Logs a vehicle selector submission to the vehicle_selector_events table.
 * Uses the service-role client: RLS on this table rejects anon inserts
 * (Postgres 42501), so the previous anon-key insert never logged anything.
 * The session id comes from the httpOnly `vf_sid` cookie (shared with /go),
 * so selector events and affiliate clicks can be joined.
 * This is a lightweight API route so the client can fire-and-forget
 * without bundling server action dependencies.
 */
export async function POST(request: NextRequest) {
  const { sessionId, isNew } = resolveSessionId(request)
  const respond = (body: Record<string, unknown>, status = 200) => {
    const response = NextResponse.json(body, { status })
    if (isNew) setSessionCookie(response, sessionId)
    return response
  }

  try {
    const body = await request.json()
    const { make, model, year, supported } = body

    if (!make || !model || typeof year !== "number") {
      return respond({ error: "Missing required fields: make, model, year" }, 400)
    }
    if (typeof make !== "string" || typeof model !== "string" || make.length > 60 || model.length > 60) {
      return respond({ error: "Invalid make or model" }, 400)
    }
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return respond({ error: "Invalid year" }, 400)
    }

    const { error } = await getServiceRoleClient().from("vehicle_selector_events").insert({
      make,
      model,
      year,
      supported: !!supported,
      session_id: sessionId,
      source: "ymm_selector",
    })

    if (error) {
      console.error("Failed to log vehicle selector event:", error)
      // Return 200 anyway so the client UX is not blocked by logging failures
      return respond({ logged: false })
    }

    return respond({ logged: true })
  } catch {
    // Swallow errors so selector UX is never blocked by logging
    return respond({ logged: false })
  }
}
