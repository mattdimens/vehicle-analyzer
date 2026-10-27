import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'
import { runFitmentAnalysis, detectProductTypes, refineProduct, runPartIdentification, type DetectedProduct } from '@/lib/analysis-stages'
import { supportedVehicles } from '@/data/vehicles/supported-vehicles'
import { normalizeYear } from '@/lib/normalize-year'
import { fetchImageForGemini } from '@/lib/gemini'
import { AnalysisResultsSchema } from '@/lib/schemas'

export function getSupabaseAdmin() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

async function logDemand(vehicleMake: string, vehicleModel: string, vehicleYear: string) {
    const isSupported = supportedVehicles.some(
        v => v.make.toLowerCase() === vehicleMake.toLowerCase() && v.model.toLowerCase() === vehicleModel.toLowerCase()
    )
    // year is NOT NULL in vehicle_selector_events; ranges log their first year
    const year = normalizeYear(vehicleYear)
    if (!isSupported && year !== null) {
        const supabase = getSupabaseAdmin()
        const { error } = await supabase.from('vehicle_selector_events').insert({
            make: vehicleMake,
            model: vehicleModel,
            year,
            supported: false,
            source: 'photo_analysis'
        })
        if (error) console.error('Failed to log photo-analysis demand:', error.message)
    }
}

/** Stamp updated_at on every write so stale-record checks work without a DB trigger. */
const now = () => new Date().toISOString()

export async function runPipeline(id: string, imageUrl: string) {
    const supabase = getSupabaseAdmin()
    try {
        await supabase.from('analyses').update({ status: 'identifying', error_details: null, updated_at: now() }).eq('id', id)
        
        const imageParts = [await fetchImageForGemini(imageUrl)]

        const fitmentRes = await runFitmentAnalysis(imageParts)
        if (!fitmentRes.success) {
            throw new Error(fitmentRes.error || 'Failed to analyze vehicle')
        }
        
        const parseResult = AnalysisResultsSchema.safeParse(fitmentRes.data)
        if (!parseResult.success) {
            console.error('Pipeline fitment validation failed:', parseResult.error.flatten())
            throw new Error('The analysis returned an unexpected format, please try again.')
        }
        
        const result = parseResult.data
        const vehicleDetailsString = `${result.primary.year} ${result.primary.make} ${result.primary.model} ${result.primary.trim}`
        
        if (result.primary.confidence >= 85) {
            await logDemand(result.primary.make, result.primary.model, result.primary.year)
        }

        await supabase.from('analyses').update({
            status: 'detecting_products',
            result_data: fitmentRes.data as Json,
            confidence: result.primary.confidence,
            updated_at: now(),
        }).eq('id', id)

        const detectRes = await detectProductTypes(imageParts, vehicleDetailsString)
        const finalDetectedProducts: DetectedProduct[] = []

        if (detectRes.success) {
            const types = detectRes.data
            const refinementResults = await Promise.allSettled(
                types.map(type => refineProduct(imageParts, type, vehicleDetailsString))
            )
            for (const r of refinementResults) {
                if (r.status === 'fulfilled') {
                    finalDetectedProducts.push(r.value)
                }
            }
        }

        await supabase.from('analyses').update({
            status: 'complete',
            detected_products: finalDetectedProducts as unknown as Json,
            updated_at: now(),
        }).eq('id', id)

    } catch (err) {
        console.error('Pipeline error for', id, err)
        await supabase.from('analyses').update({
            status: 'error',
            error_details: err instanceof Error ? err.message : String(err),
            updated_at: now(),
        }).eq('id', id)
    }
}

/**
 * Part identification for an analyses row with kind = 'part'. One Gemini
 * cascade (same as /api/analyze/part); the identification goes in
 * result_data and its confidence in confidence. It also writes the
 * analysis_results log row /api/analyze/part writes.
 */
export async function runPartPipeline(id: string, imageUrl: string) {
    const supabase = getSupabaseAdmin()
    try {
        await supabase.from('analyses').update({ status: 'identifying', error_details: null, updated_at: now() }).eq('id', id)

        const imageParts = [await fetchImageForGemini(imageUrl)]
        // The second, slower check gets its own status so /r/[id] can say so.
        // It also restamps updated_at, so the stale check sees the run is alive.
        const { identification, modelUsed } = await runPartIdentification(imageParts, {
            onEscalate: async () => {
                const { error } = await supabase.from('analyses').update({ status: 'verifying', updated_at: now() }).eq('id', id)
                if (error) throw new Error(error.message)
            },
        })

        const { error: logError } = await supabase.from('analysis_results').insert({
            analysis_data: { ...identification },
            image_url: imageUrl,
            model_used: modelUsed,
        })
        // Don't fail the analysis; the identification still succeeded
        if (logError) console.error('analysis_results insert failed for part', id, logError.message)

        await supabase.from('analyses').update({
            status: 'complete',
            result_data: identification as unknown as Json,
            // integer column
            confidence: Math.round(identification.confidence),
            updated_at: now(),
        }).eq('id', id)
    } catch (err) {
        console.error('Part pipeline error for', id, err)
        await supabase.from('analyses').update({
            status: 'error',
            error_details: err instanceof Error ? err.message : String(err),
            updated_at: now(),
        }).eq('id', id)
    }
}
