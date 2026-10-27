import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getSupabaseAdmin, runPartPipeline, runPipeline } from '@/lib/pipeline'
import { assertSupabaseStorageUrl, UrlValidationError } from '@/lib/url-validation'

export const maxDuration = 60

function generateId() {
    // 12 hex chars (48 bits) from a CSPRNG; result links are public-by-link
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}))
    const { imageUrl } = body
    // 'vehicle' (the homepage photo flow) unless the part identifier asks for 'part'
    const kind = body.kind ?? 'vehicle'

    if (!imageUrl || typeof imageUrl !== 'string') {
        return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 })
    }
    if (kind !== 'vehicle' && kind !== 'part') {
        return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
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
        // Vehicle rows rely on the column default, so the homepage keeps
        // working on a database that doesn't have the kind column yet
        ...(kind === 'part' ? { kind } : {}),
        status: 'identifying'
    }

    const { error } = await supabase.from('analyses').insert(record)
    if (error) {
        console.error('Insert error', error)
        return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
    }

    waitUntil(kind === 'part' ? runPartPipeline(id, imageUrl) : runPipeline(id, imageUrl))

    return NextResponse.json({ success: true, id }, { status: 201 })
}
