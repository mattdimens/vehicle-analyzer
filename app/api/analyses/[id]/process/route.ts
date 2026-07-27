import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getSupabaseAdmin, runPipeline } from '@/lib/pipeline'

export const maxDuration = 60

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

    waitUntil(runPipeline(id, record.image_url))

    return NextResponse.json({ success: true, message: 'Processing started' }, { status: 202 })
}
