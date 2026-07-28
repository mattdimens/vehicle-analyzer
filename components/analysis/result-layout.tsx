"use client"

import { useState, useMemo, Component, type ReactNode } from "react"
import { Check, X, AlertCircle, ChevronDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VehicleSelector } from "@/components/home/vehicle-selector"
import { AnalysisResultsView } from "@/components/analysis/analysis-results-view"
import { analysisConfig } from "@/config/analysis"
import { resolveVehicleUrl } from "@/data/vehicles/supported-vehicles"
import Link from "next/link"
import type { AnalysisRecord } from "@/types/analysis"

// ── Error Boundary ─────────────────────────────────────────────────────

interface ErrorBoundaryProps {
    children: ReactNode
    recordId?: string
}
interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

class ResultsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }
    componentDidCatch(error: Error) {
        console.error('ResultsErrorBoundary caught:', error)
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-border text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-destructive mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-6">We could not display your results. Please try again.</p>
                    <Button onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Retry
                    </Button>
                </div>
            )
        }
        return this.props.children
    }
}

// ── Year range parser ──────────────────────────────────────────────────

function parseYearRange(year: string): number[] | null {
    if (!year?.includes('-')) return null
    const parts = year.split('-').map(s => parseInt(s.trim(), 10))
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
    const [start, end] = parts
    if (start > end || end - start > 30) return null
    const years: number[] = []
    for (let y = start; y <= end; y++) years.push(y)
    return years
}

// ── Main layout ────────────────────────────────────────────────────────

interface ResultLayoutProps {
    record: AnalysisRecord
    onRecordUpdate?: (updated: AnalysisRecord) => void
}

export function ResultLayout({ record, onRecordUpdate }: ResultLayoutProps) {
    const [userConfirmed, setUserConfirmed] = useState(false)
    const [userRejected, setUserRejected] = useState(false)
    const [selectedYear, setSelectedYear] = useState<string>("")
    const [isUpdatingYear, setIsUpdatingYear] = useState(false)
    const [localRecord, setLocalRecord] = useState<AnalysisRecord>(record)

    const resultData = localRecord.result_data
    const primary = resultData?.primary

    // Guard: if no primary data, show nothing useful
    if (!primary) return null

    // Authoritative confidence from primary
    const confidence = primary.confidence

    const isMediumConfidence = confidence >= analysisConfig.confidenceThresholds.medium && confidence < analysisConfig.confidenceThresholds.high
    const isLowConfidence = confidence < analysisConfig.confidenceThresholds.medium

    // Year range detection
    const yearRange = useMemo(() => parseYearRange(primary.year), [primary.year])
    const hasYearRange = yearRange !== null

    // Catalog resolution (only for exact years)
    const exactYear = !hasYearRange && primary.year ? parseInt(primary.year, 10) : null
    const catalogUrl = exactYear && !isNaN(exactYear)
        ? resolveVehicleUrl(primary.make, primary.model, exactYear)
        : null

    const handleConfirm = () => setUserConfirmed(true)
    const handleReject = () => setUserRejected(true)

    const handleYearUpdate = async () => {
        if (!selectedYear || isUpdatingYear) return
        setIsUpdatingYear(true)

        try {
            const res = await fetch(`/api/analyses/${localRecord.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refinedYear: selectedYear }),
            })
            if (res.ok) {
                const data = await res.json()
                if (data.data) {
                    setLocalRecord(data.data)
                    onRecordUpdate?.(data.data)
                }
            }
        } catch (err) {
            console.error('Year update failed', err)
        } finally {
            setIsUpdatingYear(false)
        }
    }

    // Rejected: full selector fallback
    if (userRejected) {
        return (
            <div className="w-full max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-border">
                <h2 className="text-2xl font-bold mb-4">Let&apos;s find the right vehicle</h2>
                <p className="text-muted-foreground mb-8">Please select your vehicle manually below:</p>
                <VehicleSelector />
            </div>
        )
    }

    // Low confidence: withhold results until confirmed
    if (isLowConfidence && !userConfirmed) {
        return (
            <div className="w-full max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-border text-center">
                <h2 className="text-2xl font-bold mb-2">We think this might be a:</h2>
                <p className="text-3xl font-extrabold text-primary mb-8">
                    {primary.year} {primary.make} {primary.model} {primary.trim || ''}
                </p>

                <p className="text-muted-foreground mb-6">Is this correct?</p>
                <div className="flex items-center justify-center gap-4 mb-8">
                    <Button onClick={handleConfirm} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                        <Check className="w-5 h-5 mr-2" /> Yes, that&apos;s it
                    </Button>
                    <Button onClick={handleReject} size="lg" variant="outline">
                        <X className="w-5 h-5 mr-2" /> No, let me pick
                    </Button>
                </div>
            </div>
        )
    }

    // High, medium, and partial (year range) all render full results
    return (
        <ResultsErrorBoundary recordId={localRecord.id}>
            <div className="w-full max-w-6xl mx-auto space-y-6">
                {/* Medium Confidence Confirm/Correct Bar */}
                {isMediumConfidence && !userConfirmed && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-900">Please verify our identification</p>
                                <p className="text-sm text-amber-800">
                                    We identified this as a {primary.year} {primary.make} {primary.model}, but we are not completely sure.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button onClick={handleConfirm} size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                                Confirm
                            </Button>
                            <Button onClick={handleReject} size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                                Change
                            </Button>
                        </div>
                    </div>
                )}

                {/* Year Refinement Card (only for year ranges, not for uncertain identity) */}
                {hasYearRange && (
                    <div className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm">
                        <h3 className="text-base font-semibold text-foreground mb-1">Know the exact year?</h3>
                        <p className="text-sm text-muted-foreground mb-4">Narrow it down for more precise matches.</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                                <div className="w-full sm:w-auto">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Make</label>
                                    <div className="px-3 py-2 text-sm font-medium bg-muted/50 rounded-lg border border-border text-foreground min-w-[100px]">
                                        {primary.make}
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Model</label>
                                    <div className="px-3 py-2 text-sm font-medium bg-muted/50 rounded-lg border border-border text-foreground min-w-[100px]">
                                        {primary.model}
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Year</label>
                                    <div className="relative">
                                        <select
                                            value={selectedYear}
                                            onChange={e => setSelectedYear(e.target.value)}
                                            className="w-full sm:w-[120px] appearance-none px-3 py-2 pr-8 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        >
                                            <option value="">Select year</option>
                                            {yearRange!.map(y => (
                                                <option key={y} value={String(y)}>{y}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handleYearUpdate}
                                disabled={!selectedYear || isUpdatingYear}
                                className="w-full sm:w-auto"
                                size="default"
                            >
                                {isUpdatingYear ? "Updating..." : "Update Results"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Catalog banner (only for resolved exact years) */}
                {catalogUrl && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="text-blue-800 font-medium text-sm">
                            We have a specialized catalog of curated parts for the {primary.make} {primary.model}.{" "}
                            <Link href={catalogUrl} className="underline underline-offset-2 font-semibold hover:text-blue-900">
                                View curated picks
                            </Link>
                        </p>
                    </div>
                )}

                {/* Full results rendered from the real record shape */}
                <AnalysisResultsView record={localRecord} />
            </div>
        </ResultsErrorBoundary>
    )
}
