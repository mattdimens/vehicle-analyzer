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

/** A trimmed string, null when blank or longer than `max` (likely garbage). */
const optionalText = (max: number) =>
    z.string().nullish().catch(undefined).transform(value => {
        const text = value?.trim()
        return text && text.length <= max ? text : null
    })

/** Strings only, trimmed, blanks and over-long items dropped, at most `limit` kept. */
const clampedStringList = (limit: number, maxLength: number) =>
    z.array(z.unknown()).optional().catch(undefined).transform(items =>
        (items ?? [])
            .filter((item): item is string => typeof item === 'string')
            .map(item => item.trim())
            .filter(item => item.length > 0 && item.length <= maxLength)
            .slice(0, limit)
    )

const PartAlternativeSchema = z.object({
    partName: z.string().trim().min(1).max(80),
    confidence: z.number().finite(),
})

export const PartIdentificationSchema = z.object({
    partName: z.string(),
    category: z.string(),
    function: z.string(),
    estimatedVehicle: z.string().nullable(),
    confidence: z.number(),
    amazonSearchTerm: z.string(),
    reasoning: z.string(),
    // Optional extras: a bad value is dropped or clamped, never fails the result.
    partNumber: optionalText(40),
    searchVehicle: optionalText(60),
    alternatives: z.array(z.unknown()).optional().catch(undefined).transform(items =>
        (items ?? [])
            .map(item => PartAlternativeSchema.safeParse(item))
            .filter(result => result.success)
            .map(({ data }) => ({ partName: data.partName, confidence: Math.round(Math.min(100, Math.max(0, data.confidence))) }))
            .slice(0, 2)
    ),
    relatedParts: clampedStringList(3, 60),
    buyingCheck: optionalText(300),
})
