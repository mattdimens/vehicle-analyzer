import { NextRequest, NextResponse } from 'next/server'
import { runPartIdentification } from '@/lib/analysis-stages'
import { getSupabaseAdmin } from '@/lib/pipeline'
import { fetchValidatedImages } from '@/lib/request-images'
import { UrlValidationError } from '@/lib/url-validation'

export const maxDuration = 60

/**
 * POST /api/analyze/part
 * Body: { imageUrl: string }
 *
 * Identifies a single car part (scout + sniper cascade) and logs the result.
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}))

    let images: Awaited<ReturnType<typeof fetchValidatedImages>>
    try {
        images = await fetchValidatedImages([body.imageUrl])
    } catch (err) {
        const message = err instanceof UrlValidationError ? err.message : 'Could not load the uploaded image'
        return NextResponse.json({ success: false, error: message }, { status: 400 })
    }

    try {
        const { identification, modelUsed } = await runPartIdentification(images.parts)

        const { error: dbError } = await getSupabaseAdmin()
            .from('analysis_results')
            .insert({
                analysis_data: { ...identification },
                image_url: images.urls[0],
                model_used: modelUsed,
            })
        if (dbError) {
            // Don't fail the response; the identification still succeeded
            console.error('Supabase DB error:', dbError.message)
        }

        return NextResponse.json({ success: true, data: identification })
    } catch (err) {
        console.error('/api/analyze/part error:', err)
        const message = err instanceof Error && err.message.startsWith('The AI returned')
            ? err.message
            : 'Part identification failed, please try again.'
        return NextResponse.json({ success: false, error: message }, { status: 502 })
    }
}
