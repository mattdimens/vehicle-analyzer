import { NextResponse } from "next/server"
import { getServiceRoleClient } from "@/lib/supabase-server"

/**
 * POST /api/log-vehicle-selector
 *
 * Logs a vehicle selector submission to the vehicle_selector_events table.
 * Uses the service-role client: RLS on this table rejects anon inserts
 * (Postgres 42501), so the previous anon-key insert never logged anything.
 * This is a lightweight API route so the client can fire-and-forget
 * without bundling server action dependencies.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { make, model, year, supported, sessionId } = body

    if (!make || !model || typeof year !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: make, model, year" },
        { status: 400 }
      )
    }

    if (typeof make !== "string" || typeof model !== "string" || make.length > 60 || model.length > 60) {
      return NextResponse.json({ error: "Invalid make or model" }, { status: 400 })
    }
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 })
    }

    const supabase = getServiceRoleClient()

    const { error } = await supabase.from("vehicle_selector_events").insert({
      make,
      model,
      year,
      supported: !!supported,
      session_id: typeof sessionId === "string" ? sessionId.slice(0, 64) : null,
    })

    if (error) {
      console.error("Failed to log vehicle selector event:", error)
      // Return 200 anyway so the client UX is not blocked by logging failures
      return NextResponse.json({ logged: false })
    }

    return NextResponse.json({ logged: true })
  } catch {
    // Swallow errors so selector UX is never blocked by logging
    return NextResponse.json({ logged: false })
  }
}
