/**
 * Shared types for the /r/[id] analysis results route.
 *
 * These types describe the REAL shape of data stored in the `analyses` table
 * and returned by `/api/analyses/[id]`. The pipeline writes this shape;
 * the UI conforms to it.
 *
 * Authoritative confidence source
 * --------------------------------
 * `result_data.primary.confidence` is the single authoritative confidence
 * value used for band-label logic and all state triggers (unusable, low,
 * medium, high). The top-level `confidence` column and
 * `result_data.confidence_score` are copies written for convenience but
 * must never be read by UI code. All band logic imports `analysisConfig`
 * and compares against `result_data.primary.confidence`.
 */

// ── result_data.primary ────────────────────────────────────────────────
export interface AnalysisPrimary {
    make: string
    model: string
    /** Single year ("2014") or range ("2011-2014"). */
    year: string
    trim?: string | null
    cabStyle?: string | null
    bedLength?: string | null
    vehicleType?: string | null
    color?: string | null
    condition?: string | null
    /** Authoritative confidence value (0-100). */
    confidence: number
}

// ── result_data.otherPossibilities[] ────────────────────────────────────
export interface AnalysisOtherPossibility {
    /** The AI returns "vehicle", not "name". */
    vehicle: string
    yearRange?: string | null
    trim?: string | null
    confidence: number
}

// ── result_data (the full jsonb blob) ──────────────────────────────────
export interface AnalysisResultData {
    vehicle_present?: boolean
    primary: AnalysisPrimary
    engineDetails?: string | null
    otherPossibilities?: AnalysisOtherPossibility[]
    recommendedAccessories?: string[]
    tieredRecommendations?: { title: string; items: string[] }[]
    confidence_score?: number
    seo_optimized_alt_text?: string
}

// ── detected_products[] ────────────────────────────────────────────────
export interface AnalysisDetectedProduct {
    type: string
    brand: string
    model: string
    reasoning?: string | null
    confidence: number
}

// ── Top-level analyses row ─────────────────────────────────────────────
export interface AnalysisRecord {
    id: string
    image_url: string
    status: 'identifying' | 'detecting_products' | 'complete' | 'error'
    result_data: AnalysisResultData | null
    detected_products: AnalysisDetectedProduct[] | null
    /** Convenience copy; UI must use result_data.primary.confidence. */
    confidence: number | null
    error_details: string | null
    user_id: string | null
    created_at: string
    updated_at: string
}

// ── Band label helper ──────────────────────────────────────────────────
import { analysisConfig } from '@/config/analysis'

export type ConfidenceBand = 'High' | 'Medium' | 'Low'

export function getConfidenceBand(confidence: number): ConfidenceBand {
    if (confidence >= analysisConfig.confidenceThresholds.high) return 'High'
    if (confidence >= analysisConfig.confidenceThresholds.medium) return 'Medium'
    return 'Low'
}

export function getConfidenceBandColor(band: ConfidenceBand): string {
    switch (band) {
        case 'High': return 'bg-emerald-100 text-emerald-700'
        case 'Medium': return 'bg-amber-100 text-amber-700'
        case 'Low': return 'bg-red-100 text-red-700'
    }
}

export function getConfidenceBarColor(band: ConfidenceBand): string {
    switch (band) {
        case 'High': return 'bg-emerald-500'
        case 'Medium': return 'bg-amber-500'
        case 'Low': return 'bg-red-500'
    }
}
