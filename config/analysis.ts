export const analysisConfig = {
    confidenceThresholds: {
        high: 80,
        medium: 55,
    }
}

/**
 * Layout bands for the part identifier result. These only choose which
 * result layout a visitor sees; they don't feed analytics. The `outcome`
 * on part_identification_completed still comes from getConfidenceBand().
 */
export const partDisplayBands = {
    strong: 80,
    medium: 30,
}

export type PartDisplayBand = 'strong' | 'medium' | 'low'

export function getPartDisplayBand(confidence: number): PartDisplayBand {
    if (confidence >= partDisplayBands.strong) return 'strong'
    if (confidence >= partDisplayBands.medium) return 'medium'
    return 'low'
}
