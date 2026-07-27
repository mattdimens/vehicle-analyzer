import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { analyzeVehicleFitment, detectVisibleProducts, refineProductDetails } from '@/app/actions'
import { supportedVehicles } from '@/data/vehicles/supported-vehicles'
import { AnalysisResults, DetectedProduct } from '@/app/actions'

export function getSupabaseAdmin() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

async function logDemand(vehicleMake: string, vehicleModel: string) {
    const isSupported = supportedVehicles.some(
        v => v.make.toLowerCase() === vehicleMake.toLowerCase() && v.model.toLowerCase() === vehicleModel.toLowerCase()
    )
    if (!isSupported) {
        const supabase = getSupabaseAdmin()
        await supabase.from('vehicle_selector_events').insert({
            make: vehicleMake,
            model: vehicleModel,
            generation: null,
            source: 'photo_analysis'
        })
    }
}

export async function runPipeline(id: string, imageUrl: string) {
    const supabase = getSupabaseAdmin()
    try {
        await supabase.from('analyses').update({ status: 'identifying' }).eq('id', id)
        
        const fitmentRes = await analyzeVehicleFitment([imageUrl])
        if (!fitmentRes.success) {
            throw new Error(fitmentRes.error || 'Failed to analyze vehicle')
        }
        
        const result = fitmentRes.data as unknown as AnalysisResults
        const vehicleDetailsString = `${result.primary.year} ${result.primary.make} ${result.primary.model} ${result.primary.trim}`
        
        if (result.primary.confidence >= 85) {
            await logDemand(result.primary.make, result.primary.model)
        }

        await supabase.from('analyses').update({
            status: 'detecting_products',
            result_data: fitmentRes.data as any,
            confidence: result.primary.confidence
        }).eq('id', id)

        const detectRes = await detectVisibleProducts([imageUrl], vehicleDetailsString)
        let finalDetectedProducts: DetectedProduct[] = []

        if (detectRes.success) {
            const types = detectRes.data
            const refinementResults = await Promise.allSettled(
                types.map(type => refineProductDetails([imageUrl], type, vehicleDetailsString))
            )
            for (const r of refinementResults) {
                if (r.status === 'fulfilled') {
                    finalDetectedProducts.push(r.value)
                }
            }
        }

        await supabase.from('analyses').update({
            status: 'complete',
            detected_products: finalDetectedProducts as any,
        }).eq('id', id)

    } catch (err) {
        console.error('Pipeline error for', id, err)
        await supabase.from('analyses').update({
            status: 'error',
            error_details: err instanceof Error ? err.message : String(err)
        }).eq('id', id)
    }
}
