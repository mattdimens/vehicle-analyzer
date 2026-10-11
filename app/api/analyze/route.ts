import { NextRequest, NextResponse } from 'next/server'
import type { Database, Json } from '@/types/supabase'
import { runFitmentAnalysis } from '@/lib/analysis-stages'
import { getSupabaseAdmin } from '@/lib/pipeline'
import { UrlValidationError } from '@/lib/url-validation'
import { fetchValidatedImages } from '@/lib/request-images'
import { AnalysisResultsSchema } from '@/lib/schemas'

export const maxDuration = 60

// ---------------------------------------------------------------------------
// POST /api/analyze
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
    try {
        // 1. Parse request body ------------------------------------------------
        const body = await request.json()
        const promptContext: string | undefined = typeof body.promptContext === 'string' ? body.promptContext : undefined

        // 2. Validate (our storage only, 1-10 URLs) and fetch each image once
        let images: Awaited<ReturnType<typeof fetchValidatedImages>>
        try {
            images = await fetchValidatedImages(body.imageUrls)
        } catch (err) {
            const message = err instanceof UrlValidationError ? err.message : 'Invalid image URL'
            return NextResponse.json({ error: message }, { status: 400 })
        }
        const imageParts = images.parts

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
            image_url: images.urls[0],
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
