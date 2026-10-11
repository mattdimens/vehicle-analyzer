import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getSupabaseAdmin, runPipeline } from '@/lib/pipeline'

export const maxDuration = 60

/** Minimum gap between retries of the same analysis. */
const RETRY_COOLDOWN_MS = 10_000
/** Analyses older than this can no longer be re-run (start a new one instead). */
const MAX_RETRY_AGE_MS = 24 * 60 * 60 * 1000

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const supabase = getSupabaseAdmin()
    
    // Fetch record
    const { data: record, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single()
        
    if (error || !record) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Concurrency guard
    if (record.status === 'identifying' || record.status === 'detecting_products') {
        const updatedTime = new Date(record.updated_at).getTime()
        const now = Date.now()
        if (now - updatedTime < 120_000) {
            return NextResponse.json({ status: record.status, message: 'Already processing' }, { status: 202 })
        }
    }

    if (record.status === 'complete') {
        return NextResponse.json({ status: 'complete', message: 'Already complete' })
    }

    // Abuse guard: each retry re-runs several paid Gemini calls
    if (Date.now() - new Date(record.created_at).getTime() > MAX_RETRY_AGE_MS) {
        return NextResponse.json({ error: 'This analysis is too old to retry. Please upload the photo again.' }, { status: 410 })
    }
    if (record.status === 'error' && Date.now() - new Date(record.updated_at).getTime() < RETRY_COOLDOWN_MS) {
        return NextResponse.json({ error: 'Please wait a few seconds before retrying.' }, { status: 429 })
    }

    waitUntil(runPipeline(id, record.image_url))

    return NextResponse.json({ success: true, message: 'Processing started' }, { status: 202 })
}
