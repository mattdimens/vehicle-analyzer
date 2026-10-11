import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'

function getSupabase() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // use service role for backend updates
    )
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const supabase = getSupabase()
    
    // Fetch record
    const { data: record, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single()
        
    if (error || !record) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Stale-record handling
    if (record.status === 'identifying' || record.status === 'detecting_products') {
        const updatedTime = new Date(record.updated_at).getTime()
        const now = Date.now()
        
        // If older than 2 minutes, transition to error
        if (now - updatedTime > 120_000) {
            console.log(`Record ${id} is stale (status: ${record.status}). Auto-transitioning to error.`)
            
            const { data: updatedRecord } = await supabase
                .from('analyses')
                .update({
                    status: 'error',
                    error_details: 'Analysis timed out. Please retry.',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select('*')
                .single()
                
            return NextResponse.json({ success: true, data: updatedRecord ?? record })
        }
    }

    return NextResponse.json({ success: true, data: record })
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const { refinedYear } = body

    if (!refinedYear || !/^\d{4}$/.test(String(refinedYear))) {
        return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }
    const year = parseInt(String(refinedYear), 10)

    const supabase = getSupabase()

    // Fetch current record
    const { data: record, error: fetchError } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !record) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Only allow narrowing the AI's own year range (e.g. "2021-2024" -> "2022").
    // This endpoint is unauthenticated, so it must not accept arbitrary edits.
    const resultData = (record.result_data ?? {}) as { primary?: { year?: unknown } } & Record<string, unknown>
    const currentYear = typeof resultData.primary?.year === 'string' ? resultData.primary.year : ''
    const range = currentYear.match(/^(\d{4})\s*[-–]\s*(\d{4})$/)
    if (!resultData.primary || !range || year < parseInt(range[1], 10) || year > parseInt(range[2], 10)) {
        return NextResponse.json({ error: 'Year must be within the identified range' }, { status: 400 })
    }

    const updatedData = { ...resultData, primary: { ...resultData.primary, year: String(year) } }

    const { data: updated, error: updateError } = await supabase
        .from('analyses')
        .update({ result_data: updatedData as unknown as Json, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()

    if (updateError) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
}
