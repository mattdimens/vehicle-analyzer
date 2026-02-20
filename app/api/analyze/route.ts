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

const SYSTEM_INSTRUCTION =
    'Identify any aftermarket truck parts (bumpers, lift kits, wheels). ' +
    'Return valid JSON with fields: part_name, manufacturer_guess, ' +
    'confidence_score (integer 0-100), and seo_optimized_alt_text.'

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
// POST /api/analyze
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
    try {
        // 1. Parse request body ------------------------------------------------
        const body = await request.json()
        const imageUrl: string | undefined = body.imageUrl

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Missing required field: imageUrl' },
                { status: 400 }
            )
        }

        // 2. Fetch & convert image ---------------------------------------------
        const imagePart = await fetchImageForGemini(imageUrl)

        // 3. Scout pass (Gemini 3 Flash) ---------------------------------------
        const scoutResponse = await ai.models.generateContent({
            model: SCOUT_MODEL,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: SYSTEM_INSTRUCTION },
                        imagePart,
                    ],
                },
            ],
            config: {
                tools: [{ codeExecution: {} }],
            },
        })

        const scoutText = cleanJsonResponse(scoutResponse.text ?? '')
        let finalResult: {
            part_name: string
            manufacturer_guess: string
            confidence_score: number
            seo_optimized_alt_text: string
        }
        let modelUsed: string = SCOUT_MODEL

        try {
            finalResult = JSON.parse(scoutText)
        } catch {
            return NextResponse.json(
                { error: 'Scout model returned invalid JSON', raw: scoutText },
                { status: 502 }
            )
        }

        // 4. Gatekeeper check --------------------------------------------------
        if (finalResult.confidence_score <= CONFIDENCE_THRESHOLD) {
            console.log(
                `Scout confidence ${finalResult.confidence_score} ≤ ${CONFIDENCE_THRESHOLD} — escalating to Sniper (Pro)`
            )

            // 5. Sniper pass (Gemini 3 Pro) — fallback ---------------------------
            const sniperResponse = await ai.models.generateContent({
                model: SNIPER_MODEL,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: SYSTEM_INSTRUCTION },
                            imagePart,
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

        // 6. Log to Supabase ---------------------------------------------------
        const insertPayload: Database['public']['Tables']['analysis_results']['Insert'] = {
            analysis_data: finalResult as unknown as Database['public']['Tables']['analysis_results']['Insert']['analysis_data'],
            image_url: imageUrl,
            model_used: modelUsed,
        }

        const { error: dbError } = await supabase
            .from('analysis_results')
            .insert(insertPayload)

        if (dbError) {
            console.error('Supabase insert error:', dbError.message)
            // Don't fail the response — the analysis still succeeded
        }

        // 7. Return result to client -------------------------------------------
        return NextResponse.json({
            success: true,
            model_used: modelUsed,
            data: finalResult,
        })
    } catch (err) {
        console.error('/api/analyze error:', err)
        return NextResponse.json(
            {
                error: err instanceof Error ? err.message : String(err),
            },
            { status: 500 }
        )
    }
}
