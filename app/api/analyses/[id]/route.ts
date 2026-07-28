import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

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
                    error_details: 'Analysis timed out. Please retry.' 
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

    const body = await request.json()
    const { refinedYear } = body

    if (!refinedYear || !/^\d{4}$/.test(String(refinedYear))) {
        return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }

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

    // Update the year in result_data.primary
    const resultData = (record.result_data as any) || {}
    if (resultData.primary) {
        resultData.primary.year = String(refinedYear)
    }

    const { data: updated, error: updateError } = await supabase
        .from('analyses')
        .update({ result_data: resultData as any })
        .eq('id', id)
        .select('*')
        .single()

    if (updateError) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
}
