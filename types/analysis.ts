/**
 * Shared types for the /r/[id] analysis results route.
 *
 * These types describe the REAL shape of data stored in the `analyses` table
 * and returned by `/api/analyses/[id]`. The pipeline writes this shape;
 * the UI conforms to it.
 *
 * Authoritative confidence source
 * --------------------------------
 * Confidence is stored in three mutually exclusive places depending on analysis type.
 * All UI code must use the `getConfidence(record)` resolver to determine the 
 * authoritative value, which checks in this priority order:
 * 1. `record.confidence_score`
 * 2. `record.confidence`
 * 3. `record.result_data?.primary?.confidence`
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
    confidence_score?: number | null
    confidence: number | null
    error_details: string | null
    user_id: string | null
    created_at: string
    updated_at: string
}

export function getConfidence(record: AnalysisRecord): number {
    if (record.confidence_score != null) return record.confidence_score;
    if (record.confidence != null) return record.confidence;
    if (record.result_data?.primary?.confidence != null) return record.result_data.primary.confidence;
    return 0; // Sentinel value that routes to Low confidence
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
