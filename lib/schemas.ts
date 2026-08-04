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
    primary: PrimaryVehicleSchema,
    engineDetails: z.string().nullable(),
    otherPossibilities: z.array(z.object({
        name: z.string().default(''),
        vehicle: z.string().optional(),
        yearRange: z.string().optional(),
        trim: z.string().optional(),
        confidence: z.number(),
    }).transform(item => ({
        name: item.name || item.vehicle || 'Unknown',
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
