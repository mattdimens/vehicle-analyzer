"use client"

import { useState, Component, type ReactNode } from "react"
import { AlertCircle, Check, RefreshCw } from "lucide-react"
import { VehicleSelector } from "@/components/home/vehicle-selector"
import { AnalysisResultsView, type YearChoice } from "@/components/analysis/analysis-results-view"
import { analysisConfig } from "@/config/analysis"
import { resolveCatalogGeneration } from "@/data/vehicles/supported-vehicles"
import type { AnalysisRecord } from "@/types/analysis"
import { getConfidence } from "@/types/analysis"
import { parseYearRange, vehicleTitle } from "@/lib/vehicle-result"
import {
    AiDisclaimer,
    cardClass,
    CommissionNote,
    primaryButtonClass,
    ResultPhoto,
} from "@/components/results/result-shell"
import { cn } from "@/lib/utils"

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
                <div className={cn(cardClass, "flex flex-col items-center gap-3 px-6 py-10 text-center")}>
                    <AlertCircle className="h-10 w-10 text-[#9B1C1C]" aria-hidden="true" />
                    <h1 className="font-heading text-xl font-bold text-[#17212B]">Something went wrong</h1>
                    <p className="text-[15px] text-[#2B3742]">We could not display your results. Please try again.</p>
                    <button type="button" onClick={() => window.location.reload()} className={cn(primaryButtonClass, "mt-2 w-auto px-6")}>
                        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}

/** Small disclaimer and commission note for states without their own shop area. */
export function ResultNoticesFooter() {
    return (
        <div className="flex flex-col gap-2">
            <AiDisclaimer />
            <CommissionNote />
        </div>
    )
}

// ── Main layout ────────────────────────────────────────────────────────

interface ResultLayoutProps {
    record: AnalysisRecord
    onRecordUpdate?: (updated: AnalysisRecord) => void
}

export function ResultLayout({ record, onRecordUpdate }: ResultLayoutProps) {
    const [userConfirmed, setUserConfirmed] = useState(false)
    const [userRejected, setUserRejected] = useState(false)
    const [localRecord, setLocalRecord] = useState<AnalysisRecord>(record)
    // The range the record arrived with. Kept after a year is picked so the
    // chips stay on screen with the chosen one selected.
    const [initialYears] = useState(() => parseYearRange(record.result_data?.primary?.year))
    const [selectedYear, setSelectedYear] = useState<number | null>(null)
    const [yearStatus, setYearStatus] = useState<YearChoice["status"]>("idle")

    const resultData = localRecord.result_data
    const primary = resultData?.primary

    // Guard: if no primary data, show nothing useful
    if (!primary) return null

    // Authoritative confidence from resolver
    const confidence = getConfidence(localRecord)

    const isMediumConfidence = confidence >= analysisConfig.confidenceThresholds.medium && confidence < analysisConfig.confidenceThresholds.high
    const isLowConfidence = confidence < analysisConfig.confidenceThresholds.medium

    // Curated catalog link: an exact year, or a range inside one generation
    const currentYears = parseYearRange(primary.year)
    const exactYear = currentYears ? null : parseInt(primary.year, 10)
    const catalog = currentYears
        ? resolveCatalogGeneration(primary.make, primary.model, currentYears[0], currentYears[currentYears.length - 1])
        : exactYear !== null && !isNaN(exactYear)
            ? resolveCatalogGeneration(primary.make, primary.model, exactYear, exactYear)
            : null

    const handleConfirm = () => setUserConfirmed(true)
    const handleReject = () => setUserRejected(true)

    // Only narrows the identified range (the PATCH rules), so one pick per record
    const handleYearSelect = async (year: number) => {
        if (selectedYear !== null || yearStatus === "saving") return
        setYearStatus("saving")

        try {
            const res = await fetch(`/api/analyses/${localRecord.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refinedYear: String(year) }),
            })
            const data = res.ok ? await res.json() : null
            if (!data?.data) throw new Error(`Year update failed (${res.status})`)
            setLocalRecord(data.data)
            onRecordUpdate?.(data.data)
            setSelectedYear(year)
            setYearStatus("idle")
        } catch (err) {
            console.error('Year update failed', err)
            setYearStatus("error")
        }
    }

    // Rejected: full selector fallback (for Medium confidence rejection)
    if (userRejected) {
        return (
            <section aria-label="Pick your vehicle" className={cn(cardClass, "flex flex-col gap-2 p-6")}>
                <h1 className="font-heading text-2xl font-bold text-[#17212B]">Let&apos;s find the right vehicle</h1>
                <p className="mb-4 text-[15px] text-[#2B3742]">Please select your vehicle manually below:</p>
                <VehicleSelector location="results_correction" />
            </section>
        )
    }

    // Low confidence: withhold results until confirmed
    if (isLowConfidence && !userConfirmed) {
        return (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
                <section aria-label="Confirm your vehicle" className={cn(cardClass, "flex flex-col gap-4 py-5 sm:p-6")}>
                    <div className="flex items-center gap-3">
                        <ResultPhoto fit="contain" imageUrl={record.image_url} alt="Uploaded photo" className="h-16 w-16 sm:h-24 sm:w-24" />
                        <h1 className="font-heading text-[22px] font-bold leading-tight text-[#17212B]">
                            We think we&apos;ve got it, but we&apos;re not fully sure.
                        </h1>
                    </div>
                    <p className="text-[15px] leading-normal text-[#2B3742]">
                        Here&apos;s our best read on your vehicle. Confirm it and we&apos;ll pull matching parts, or set it straight below.
                    </p>

                    <div className="flex flex-col gap-3 rounded-xl bg-[#F4F7F9] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5A6672]">Best Guess</p>
                        <p className="font-heading text-2xl font-bold text-[#17212B]">{vehicleTitle(primary)}</p>
                        <button type="button" onClick={handleConfirm} className={primaryButtonClass}>
                            <Check className="h-5 w-5" aria-hidden="true" /> Yes, that&apos;s my vehicle
                        </button>
                    </div>

                    <div className="border-t border-[#E4EBF0] pt-4">
                        <p className="mb-3 text-sm font-semibold text-[#17212B]">Not quite? Pick your vehicle</p>
                        <VehicleSelector location="results_correction" />
                    </div>
                </section>
                <ResultNoticesFooter />
            </div>
        )
    }

    // High, medium, and partial (year range) all render full results
    return (
        <ResultsErrorBoundary recordId={localRecord.id}>
            <AnalysisResultsView
                record={localRecord}
                yearChoice={initialYears ? {
                    years: initialYears,
                    selected: selectedYear,
                    status: yearStatus,
                    onSelect: handleYearSelect,
                } : null}
                catalog={catalog}
                verify={isMediumConfidence && !userConfirmed ? { onConfirm: handleConfirm, onChange: handleReject } : null}
                onPickVehicle={handleReject}
            />
        </ResultsErrorBoundary>
    )
}
