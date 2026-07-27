import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * POST /api/log-vehicle-selector
 *
 * Logs a vehicle selector submission to the vehicle_selector_events table.
 * Uses the anon key (client-safe) because the table's RLS allows anonymous
 * inserts.  This is a lightweight API route so the client can fire-and-forget
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.from("vehicle_selector_events").insert({
      make,
      model,
      year,
      supported: !!supported,
      session_id: sessionId || null,
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
