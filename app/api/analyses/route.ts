import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getSupabaseAdmin, runPipeline } from '@/lib/pipeline'
import { assertSupabaseStorageUrl, UrlValidationError } from '@/lib/url-validation'

export const maxDuration = 60

function generateId() {
    return Math.random().toString(36).substring(2, 10) // 8 char opaque ID
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { imageUrl } = body

    if (!imageUrl) {
        return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 })
    }

    // Security: validate that the URL points to our own Supabase storage
    try {
        assertSupabaseStorageUrl(imageUrl)
    } catch (err) {
        const message = err instanceof UrlValidationError ? err.message : 'Invalid image URL'
        return NextResponse.json({ error: message }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const id = generateId()

    const record = {
        id,
        image_url: imageUrl,
        status: 'identifying'
    }

    const { error } = await supabase.from('analyses').insert(record)
    if (error) {
        console.error('Insert error', error)
        return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
    }

    waitUntil(runPipeline(id, imageUrl))

    return NextResponse.json({ success: true, id }, { status: 201 })
}
