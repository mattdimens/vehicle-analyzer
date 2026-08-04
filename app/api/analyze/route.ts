import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import {
    getAI,
    SCOUT_MODEL,
    SNIPER_MODEL,
    CASCADE_CONFIDENCE_THRESHOLD,
    cleanJsonResponse,
    fetchImageForGemini,
    buildSpecificLogicInstruction,
    sanitizePromptContext,
} from '@/lib/gemini'
import { assertSupabaseStorageUrls, UrlValidationError } from '@/lib/url-validation'
import { AnalysisResultsSchema } from '@/lib/schemas'

export const maxDuration = 60

// ---------------------------------------------------------------------------
// Supabase client (server-side, lazy init to avoid build-time crashes)
// ---------------------------------------------------------------------------
let _supabase: ReturnType<typeof createClient<Database>> | null = null
function getSupabase() {
    if (!_supabase) {
        _supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }
    return _supabase
}

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
        const imageUrls: string[] = body.imageUrls
        const promptContext: string | undefined = sanitizePromptContext(body.promptContext)

        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
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
            imageUrls.map((url) => fetchImageForGemini(url))
        )

        // 3. Build the prompt --------------------------------------------------
        const contextInstruction = promptContext
            ? ` PAY SPECIAL ATTENTION to ${promptContext}. Ensure your analysis is relevant to users interested in ${promptContext}.`
            : ''

        const specificLogicInstruction = buildSpecificLogicInstruction(promptContext)

        const prompt =
            'You are an expert vehicle mechanic and fitment specialist. Analyze the vehicle shown in these images (they are different views of the same vehicle). ' +
            contextInstruction +
            'Identify the following for the **primary, most likely vehicle**: ' +
            '1. `make` (string) ' +
            '2. `model` (string) ' +
            '3. `year` (string, use a range like "2021-2024" if exact year is uncertain) ' +
            '4. `trim` (string, e.g., "XLT", "Lariat", "Base") ' +
            '5. `cabStyle` (string, e.g., "SuperCrew", "Quad Cab", or null if not applicable/visible) ' +
            '6. `bedLength` (string, e.g., "67.1\\" (Short)", or null if not applicable/visible) ' +
            '7. `vehicleType` (string, e.g., "SUV", "Sedan", "Pickup Truck") ' +
            '8. `color` (string) ' +
            '9. `condition` (string, e.g., "new", "used", "damaged") ' +
            '10. `confidence` (number, 0-100, representing your confidence in this primary identification) ' +
            'Also identify: ' +
            '* `vehicle_present` (boolean): Set to true when ANY identifiable road vehicle (car, truck, SUV, van, motorcycle, trailer, or similar) is visible in the image, even if blurry, partial, or hard-to-identify. Set to false ONLY when the image contains no vehicle at all (e.g. a person, animal, landscape, document, or unrelated object). This is independent of your identification confidence. ' +
            '* `engineDetails` (string, e.g., "5.0L V8", "2.7L EcoBoost V6", or "No details available" if not visible/determinable) ' +
            '* `otherPossibilities` (an array of 2-3 other likely possibilities, each with its own vehicle name, year range, trim, and confidence) ' +
            '* `recommendedAccessories` (an array of 3-5 recommended aftermarket accessories as strings. ALWAYS format each string as "Product Name (e.g. Example 1, Example 2)". IF tiered recommendations are requested, keep this as a fallback summary list). ' +
            specificLogicInstruction +
            '* `confidence_score` (integer 0-100, your overall confidence in the ENTIRE analysis, covering vehicle identification + any aftermarket part detection) ' +
            '* `seo_optimized_alt_text` (string, a descriptive, SEO-friendly alt text for this vehicle image, e.g., "2022 Ford F-150 Lariat SuperCrew with aftermarket wheels and tonneau cover") ' +
            'Respond ONLY with a valid, minified JSON object with this exact structure: ' +
            '{' +
            '"vehicle_present": boolean, ' +
            '"primary": {' +
            '"make": string, "model": string, "year": string, "trim": string, "cabStyle": string | null, "bedLength": string | null, ' +
            '"vehicleType": string, "color": string, "condition": string, "confidence": number' +
            '}, ' +
            '"engineDetails": string | null, ' +
            '"otherPossibilities": [' +
            '{ "vehicle": string, "yearRange": string, "trim": string, "confidence": number }' +
            '], ' +
            '"recommendedAccessories": [string], ' +
            '"tieredRecommendations": [{ "title": string, "items": [string] }] (OPTIONAL, include only if instructed), ' +
            '"confidence_score": number, ' +
            '"seo_optimized_alt_text": string' +
            '}'

        // 4. Scout pass (Gemini 3 Flash) with Code Execution ----------------
        const scoutResponse = await getAI().models.generateContent({
            model: SCOUT_MODEL,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        ...imageParts,
                    ],
                },
            ]
        })

        const scoutText = cleanJsonResponse(scoutResponse.text ?? '')

        let finalResult: Record<string, unknown>
        let modelUsed: string = SCOUT_MODEL

        try {
            finalResult = JSON.parse(scoutText)
        } catch {
            console.error('Scout model returned invalid JSON:', scoutText)
            return NextResponse.json(
                { success: false, error: 'Scout model returned invalid JSON' },
                { status: 502 }
            )
        }

        // 5. Gatekeeper check on confidence_score ------------------------------
        const confidenceScore = typeof finalResult.confidence_score === 'number'
            ? finalResult.confidence_score
            : 0

        if (confidenceScore <= CASCADE_CONFIDENCE_THRESHOLD) {
            console.log(
                `Scout confidence_score ${confidenceScore} ≤ ${CASCADE_CONFIDENCE_THRESHOLD}: escalating to Sniper (Pro)`
            )

            // 6. Sniper pass (Gemini 3 Pro) fallback ---------------------------
            const sniperResponse = await getAI().models.generateContent({
                model: SNIPER_MODEL,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            ...imageParts,
                        ],
                    },
                ],
            })

            const sniperText = cleanJsonResponse(sniperResponse.text ?? '')

            try {
                const sniperParsed = JSON.parse(sniperText)
                
                // Only accept Sniper's result if it's actually valid JSON
                // (We'll validate the schema below)
                if (sniperParsed) {
                    finalResult = sniperParsed
                    modelUsed = SNIPER_MODEL
                }
            } catch {
                // If Sniper also fails to parse, keep the Scout result
                console.warn('Sniper model returned invalid JSON, keeping Scout result')
            }
        }

        // Validate finalResult against schema
        const parseResult = AnalysisResultsSchema.safeParse(finalResult)
        if (!parseResult.success) {
            console.error('Fitment validation failed:', parseResult.error.flatten())
            return NextResponse.json(
                { success: false, error: 'The analysis returned an unexpected format, please try again.' },
                { status: 502 }
            )
        }
        
        finalResult = parseResult.data

        // 7. Log to Supabase ---------------------------------------------------
        const insertPayload: Database['public']['Tables']['analysis_results']['Insert'] = {
            analysis_data: finalResult as unknown as Database['public']['Tables']['analysis_results']['Insert']['analysis_data'],
            image_url: imageUrls[0],
            model_used: modelUsed,
        }

        const { error: dbError } = await getSupabase()
            .from('analysis_results')
            .insert(insertPayload)

        if (dbError) {
            console.error('Supabase insert error:', dbError.message)
            // Don't fail the response; the analysis still succeeded
        }

        // 8. Return result to client -------------------------------------------
        return NextResponse.json({
            success: true,
            model_used: modelUsed,
            data: finalResult,
        })
    } catch (err) {
        console.error('/api/analyze error:', err)
        return NextResponse.json(
            {
                success: false,
                error: err instanceof Error ? err.message : String(err),
            },
            { status: 500 }
        )
    }
}
