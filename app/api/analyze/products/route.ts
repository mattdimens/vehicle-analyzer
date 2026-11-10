import { NextRequest, NextResponse } from 'next/server'
import { detectAndRefineProducts } from '@/lib/analysis-stages'
import { attachProductsToLatestResult } from '@/lib/analysis-results-log'
import { fetchValidatedImages } from '@/lib/request-images'
import { UrlValidationError } from '@/lib/url-validation'
import { analysisErrorStatus, classifyAnalysisError, publicAnalysisError } from '@/lib/analysis-errors'

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
            const kind = classifyAnalysisError(result.error)
            console.error(`Product detection failed [${kind}]:`, result.error)
            return NextResponse.json(
                { success: false, error: publicAnalysisError(result.error, 'Product detection failed, please try again.') },
                { status: analysisErrorStatus(kind) }
            )
        }

        await attachProductsToLatestResult(images.urls[0], result.data)

        return NextResponse.json({ success: true, data: result.data })
    } catch (err) {
        const kind = classifyAnalysisError(err)
        console.error(`/api/analyze/products error [${kind}]:`, err)
        return NextResponse.json(
            { success: false, error: publicAnalysisError(err, 'Product detection failed, please try again.') },
            { status: kind === 'unknown' ? 500 : analysisErrorStatus(kind) }
        )
    }
}
