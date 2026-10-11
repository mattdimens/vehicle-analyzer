import { z } from 'zod'

export const PrimaryVehicleSchema = z.object({
    make: z.string(),
    model: z.string(),
    year: z.string(),
    trim: z.string(),
    cabStyle: z.string().nullable(),
    bedLength: z.string().nullable(),
    vehicleType: z.string(),
    color: z.string(),
    condition: z.string(),
    confidence: z.number(),
})

export const AnalysisResultsSchema = z.object({
    // Optional extras: never fail validation over these, just drop bad values.
    vehicle_present: z.boolean().optional().catch(undefined),
    confidence_score: z.number().optional().catch(undefined),
    seo_optimized_alt_text: z.string().optional().catch(undefined),
    primary: PrimaryVehicleSchema,
    engineDetails: z.string().nullable(),
    otherPossibilities: z.array(z.object({
        name: z.string().default(''),
        vehicle: z.string().nullish(),
        yearRange: z.string().nullish(),
        trim: z.string().nullish(),
        confidence: z.number(),
    }).transform(item => ({
        name: item.name || item.vehicle || 'Unknown',
        vehicle: item.vehicle ?? undefined,
        yearRange: item.yearRange ?? undefined,
        trim: item.trim ?? undefined,
        confidence: item.confidence,
    }))),
    recommendedAccessories: z.array(z.string()),
    tieredRecommendations: z.array(z.object({
        title: z.string(),
        items: z.array(z.string()),
    })).optional(),
})

export const DetectedProductSchema = z.object({
    type: z.string(),
    brand: z.string(),
    model: z.string(),
    confidence: z.number(),
    reasoning: z.string(),
})

export const PartIdentificationSchema = z.object({
    partName: z.string(),
    category: z.string(),
    function: z.string(),
    estimatedVehicle: z.string().nullable(),
    confidence: z.number(),
    amazonSearchTerm: z.string(),
    reasoning: z.string(),
})
