import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// ---------------------------------------------------------------------------
// Supabase client (server-side, type-safe)
// ---------------------------------------------------------------------------
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ---------------------------------------------------------------------------
// Google GenAI client (@google/genai SDK)
// ---------------------------------------------------------------------------
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SCOUT_MODEL = 'gemini-3-flash-preview'
const SNIPER_MODEL = 'gemini-3-pro-preview'
const CONFIDENCE_THRESHOLD = 85

// ---------------------------------------------------------------------------
// Helper: fetch an image URL and convert it to Gemini inlineData format
// ---------------------------------------------------------------------------
export async function fetchImageForGemini(imageUrl: string) {
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error('Failed to fetch image')

    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    return { inlineData: { data: base64Data, mimeType: mimeType } }
}

// ---------------------------------------------------------------------------
// Helper: strip markdown code fences from AI responses
// ---------------------------------------------------------------------------
function cleanJsonResponse(text: string): string {
    return text.replace(/```json\s*/g, '').replace(/```/g, '').trim()
}

// ---------------------------------------------------------------------------
// Helper: build the category-specific tiered recommendation instruction
// ---------------------------------------------------------------------------
function buildSpecificLogicInstruction(promptContext?: string): string {
    if (!promptContext) return ''

    const lower = promptContext.toLowerCase()

    if (lower.includes('truck bed cover') || lower.includes('tonneau')) {
        return `
      For the "recommendedAccessories", follow this STRICT hierarchy:
      1. "Essential Bed Protection & Organization Add-ons": Bed Mats/Rugs (e.g. BedRug, Dee Zee), Swing-out cases (e.g. UnderCover SwingCase), BedSlides (e.g. BEDSLIDE S), Cargo Bars, Tailgate Seals, Electronic Tailgate Locks.
      2. "Compatible Hauling Hardware & Rack Systems": Bed Racks (e.g. Yakima OverHaul, Thule), Toolboxes (e.g. UWS Low Profile).
      3. "Alternative Truck Bed Enclosure Solutions": Camper Shells (e.g. LEER, ARE), Soft Toppers (e.g. Softopper), Canvas Tarps.
      IMPORTANT: For EVERY item in the "items" array, strictly follow the format: "Product Name (e.g. Example 1, Example 2)".
      INSTEAD of a simple string array for "recommendedAccessories", return a "tieredRecommendations" array in the JSON with objects having "title" and "items" array.
    `
    }

    if (lower.includes('wheels') || lower.includes('rims') || lower.includes('tires')) {
        return `
      For the "recommendedAccessories", follow this STRICT hierarchy:
      1. "Essential Tire Integration & Installation Hardware": Tires (e.g. Nitto Ridge Grappler, Falken Wildpeak), TPMS Sensors (e.g. Autel MX-Sensor), Hub Centric Rings (e.g. Gorilla), Aftermarket Lug Nuts (e.g. McGard, Gorilla).
      2. "Stance Modification & Clearance Components": Suspension (e.g. Bilstein 5100, Rough Country Lift), Fender Flares (e.g. Bushwacker Pocket Style), Wheel Spacers (e.g. Bora, Spidertrax).
      3. "Cosmetic Overlay & Restoration Alternatives": Wheel Skins (e.g. Coast to Coast), Hubcaps, Caliper Covers (e.g. MGP).
      IMPORTANT: For EVERY item in the "items" array, strictly follow the format: "Product Name (e.g. Example 1, Example 2)".
      INSTEAD of a simple string array for "recommendedAccessories", return a "tieredRecommendations" array in the JSON with objects having "title" and "items" array.
    `
    }

    if (lower.includes('nerf bars') || lower.includes('running boards') || lower.includes('side steps')) {
        return `
      For the "recommendedAccessories", follow this STRICT hierarchy:
      1. "Supplemental Access Points & Paint Protection": Rear Access (e.g. AMP Research BedStep), Hitch Steps (e.g. WeatherTech BumpStep), Mud Flaps (e.g. WeatherTech No-Drill), Door Sill Guards (e.g. AVS).
      2. "Heavy-Duty Frame Protection & Lighting Integration": Rock Sliders (e.g. N-Fab RKR, Tyger Auto), LED Light Strips (e.g. OPT7), Gap Guards (e.g. Performance Accessories).
      3. "Automated & Compact Step Alternatives": Power Steps (e.g. AMP Research PowerStep), Hoop Steps (e.g. Bully, N-Fab), Drop Steps (e.g. Westin HDX).
      IMPORTANT: For EVERY item in the "items" array, strictly follow the format: "Product Name (e.g. Example 1, Example 2)".
      INSTEAD of a simple string array for "recommendedAccessories", return a "tieredRecommendations" array in the JSON with objects having "title" and "items" array.
    `
    }

    return ''
}

// ---------------------------------------------------------------------------
// POST /api/analyze
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
    try {
        // 1. Parse request body ------------------------------------------------
        const body = await request.json()
        const imageUrls: string[] = body.imageUrls
        const promptContext: string | undefined = body.promptContext

        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            return NextResponse.json(
                { error: 'Missing required field: imageUrls (must be a non-empty array)' },
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
            '* `engineDetails` (string, e.g., "5.0L V8", "2.7L EcoBoost V6", or "No details available" if not visible/determinable) ' +
            '* `otherPossibilities` (an array of 2-3 other likely possibilities, each with its own vehicle name, year range, trim, and confidence) ' +
            '* `recommendedAccessories` (an array of 3-5 recommended aftermarket accessories as strings. ALWAYS format each string as "Product Name (e.g. Example 1, Example 2)". IF tiered recommendations are requested, keep this as a fallback summary list). ' +
            specificLogicInstruction +
            '* `confidence_score` (integer 0-100, your overall confidence in the ENTIRE analysis — vehicle identification + any aftermarket part detection) ' +
            '* `seo_optimized_alt_text` (string, a descriptive, SEO-friendly alt text for this vehicle image, e.g., "2022 Ford F-150 Lariat SuperCrew with aftermarket wheels and tonneau cover") ' +
            'Respond ONLY with a valid, minified JSON object with this exact structure: ' +
            '{' +
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

        // 4. Scout pass (Gemini 3 Flash) — with Code Execution ----------------
        const scoutResponse = await ai.models.generateContent({
            model: SCOUT_MODEL,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        ...imageParts,
                    ],
                },
            ],
            config: {
                tools: [{ codeExecution: {} }],
            },
        })

        const scoutText = cleanJsonResponse(scoutResponse.text ?? '')

        let finalResult: Record<string, unknown>
        let modelUsed: string = SCOUT_MODEL

        try {
            finalResult = JSON.parse(scoutText)
        } catch {
            return NextResponse.json(
                { success: false, error: 'Scout model returned invalid JSON', raw: scoutText },
                { status: 502 }
            )
        }

        // 5. Gatekeeper check on confidence_score ------------------------------
        const confidenceScore = typeof finalResult.confidence_score === 'number'
            ? finalResult.confidence_score
            : 0

        if (confidenceScore <= CONFIDENCE_THRESHOLD) {
            console.log(
                `Scout confidence_score ${confidenceScore} ≤ ${CONFIDENCE_THRESHOLD} — escalating to Sniper (Pro)`
            )

            // 6. Sniper pass (Gemini 3 Pro) — fallback ---------------------------
            const sniperResponse = await ai.models.generateContent({
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
                config: {
                    tools: [{ codeExecution: {} }],
                },
            })

            const sniperText = cleanJsonResponse(sniperResponse.text ?? '')

            try {
                finalResult = JSON.parse(sniperText)
                modelUsed = SNIPER_MODEL
            } catch {
                // If Sniper also fails to parse, keep the Scout result
                console.warn('Sniper model returned invalid JSON, keeping Scout result')
            }
        }

        // 7. Log to Supabase ---------------------------------------------------
        const insertPayload: Database['public']['Tables']['analysis_results']['Insert'] = {
            analysis_data: finalResult as unknown as Database['public']['Tables']['analysis_results']['Insert']['analysis_data'],
            image_url: imageUrls[0],
            model_used: modelUsed,
        }

        const { error: dbError } = await supabase
            .from('analysis_results')
            .insert(insertPayload)

        if (dbError) {
            console.error('Supabase insert error:', dbError.message)
            // Don't fail the response — the analysis still succeeded
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
