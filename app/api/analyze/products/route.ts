import { NextRequest, NextResponse } from 'next/server'
import { detectAndRefineProducts } from '@/lib/analysis-stages'
import { attachProductsToLatestResult } from '@/lib/analysis-results-log'
import { fetchValidatedImages } from '@/lib/request-images'
import { UrlValidationError } from '@/lib/url-validation'

// Detection + parallel refinement (each may escalate to the Pro model)
export const maxDuration = 60

/**
 * POST /api/analyze/products
 * Body: { imageUrls: string[], vehicleDetails?: string | null, promptContext?: string }
 *
 * Detects visible products and refines each one, fetching the images once.
 * When a fitment row exists for imageUrls[0], the products are attached to it.
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}))
    const vehicleDetails = typeof body.vehicleDetails === 'string' ? body.vehicleDetails : null
    const promptContext = typeof body.promptContext === 'string' ? body.promptContext : undefined

    let images: Awaited<ReturnType<typeof fetchValidatedImages>>
    try {
        images = await fetchValidatedImages(body.imageUrls)
    } catch (err) {
        const message = err instanceof UrlValidationError ? err.message : 'Could not load the uploaded images'
        return NextResponse.json({ success: false, error: message }, { status: 400 })
    }

    try {
        const result = await detectAndRefineProducts(images.parts, vehicleDetails, promptContext)
        if (!result.success) {
            console.error('Product detection failed:', result.error)
            return NextResponse.json({ success: false, error: 'Product detection failed, please try again.' }, { status: 502 })
        }

        await attachProductsToLatestResult(images.urls[0], result.data)

        return NextResponse.json({ success: true, data: result.data })
    } catch (err) {
        console.error('/api/analyze/products error:', err)
        return NextResponse.json({ success: false, error: 'Product detection failed, please try again.' }, { status: 500 })
    }
}
