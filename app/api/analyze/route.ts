import { NextRequest, NextResponse } from 'next/server'
import type { Database, Json } from '@/types/supabase'
import { fetchImageForGemini } from '@/lib/gemini'
import { runFitmentAnalysis } from '@/lib/analysis-stages'
import { getSupabaseAdmin } from '@/lib/pipeline'
import { assertSupabaseStorageUrls, UrlValidationError } from '@/lib/url-validation'
import { AnalysisResultsSchema } from '@/lib/schemas'

export const maxDuration = 60

// ---------------------------------------------------------------------------
// Security constants
// ---------------------------------------------------------------------------
const MAX_IMAGE_URLS = 10

// ---------------------------------------------------------------------------
// POST /api/analyze
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
    try {
        // 1. Parse request body ------------------------------------------------
        const body = await request.json()
        const imageUrls: unknown = body.imageUrls
        const promptContext: string | undefined = typeof body.promptContext === 'string' ? body.promptContext : undefined

        if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
            return NextResponse.json(
                { error: 'Missing required field: imageUrls (must be a non-empty array)' },
                { status: 400 }
            )
        }

        // Security: cap the number of image URLs
        if (imageUrls.length > MAX_IMAGE_URLS) {
            return NextResponse.json(
                { error: `Too many image URLs (max ${MAX_IMAGE_URLS})` },
                { status: 400 }
            )
        }

        // Security: validate that every URL points to our Supabase storage
        try {
            assertSupabaseStorageUrls(imageUrls)
        } catch (err) {
            const message = err instanceof UrlValidationError ? err.message : 'Invalid image URL'
            return NextResponse.json(
                { error: message },
                { status: 400 }
            )
        }

        // 2. Fetch & convert all images ----------------------------------------
        const imageParts = await Promise.all(
            (imageUrls as string[]).map((url) => fetchImageForGemini(url))
        )

        // 3. Scout + Sniper cascade (prompt lives in lib/analysis-stages.ts) ---
        const fitmentRes = await runFitmentAnalysis(imageParts, promptContext)
        if (!fitmentRes.success) {
            console.error('Fitment analysis failed:', fitmentRes.error)
            return NextResponse.json(
                { success: false, error: fitmentRes.error },
                { status: 502 }
            )
        }

        // 4. Validate against schema -------------------------------------------
        const parseResult = AnalysisResultsSchema.safeParse(fitmentRes.data)
        if (!parseResult.success) {
            console.error('Fitment validation failed:', parseResult.error.flatten())
            return NextResponse.json(
                { success: false, error: 'The analysis returned an unexpected format, please try again.' },
                { status: 502 }
            )
        }

        const finalResult = parseResult.data

        // 5. Log to Supabase ---------------------------------------------------
        const insertPayload: Database['public']['Tables']['analysis_results']['Insert'] = {
            analysis_data: finalResult as unknown as Json,
            image_url: (imageUrls as string[])[0],
            model_used: fitmentRes.modelUsed,
        }

        const { error: dbError } = await getSupabaseAdmin()
            .from('analysis_results')
            .insert(insertPayload)

        if (dbError) {
            console.error('Supabase insert error:', dbError.message)
            // Don't fail the response; the analysis still succeeded
        }

        // 6. Return result to client -------------------------------------------
        return NextResponse.json({
            success: true,
            model_used: fitmentRes.modelUsed,
            data: finalResult,
        })
    } catch (err) {
        console.error('/api/analyze error:', err)
        return NextResponse.json(
            {
                success: false,
                error: 'Analysis failed, please try again.',
            },
            { status: 500 }
        )
    }
}
