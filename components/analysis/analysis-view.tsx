"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { VehicleSelector } from "@/components/home/vehicle-selector"
import { cardClass, primaryButtonClass, ResultPhoto } from "@/components/results/result-shell"
import { cn } from "@/lib/utils"
import { ResultLayout, ResultNoticesFooter } from "./result-layout"
import { PartResultView } from "./part-result-view"
import type { AnalysisRecord } from "@/types/analysis"
import { getConfidenceBand, getPartIdentification, isPartRecord } from "@/types/analysis"
import { apiErrorMessage, readJson } from "@/lib/api-errors"

const stateCardClass = cn(cardClass, "flex flex-col items-center gap-2 px-5 py-8 text-center sm:p-8")

export function AnalysisView({ id }: { id: string }) {
    const [record, setRecord] = useState<AnalysisRecord | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPolling, setIsPolling] = useState(true)

    const fetchRecord = useCallback(async () => {
        try {
            const res = await fetch(`/api/analyses/${id}`)
            if (!res.ok) {
                if (res.status === 404) setError("Analysis not found.")
                else setError("Failed to load analysis.")
                setIsPolling(false)
                return
            }
            const data = await res.json()
            setRecord(data.data)

            if (data.data.status === 'complete' || data.data.status === 'error') {
                setIsPolling(false)
            }
        } catch (err) {
            console.error(err)
            setError("Network error.")
            setIsPolling(false)
        }
    }, [id])

    useEffect(() => {
        // Initial load; fetchRecord only sets state after its request resolves
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchRecord()
    }, [fetchRecord])

    useEffect(() => {
        if (!isPolling) return
        const interval = setInterval(fetchRecord, 2000)
        return () => clearInterval(interval)
    }, [isPolling, fetchRecord])

    // Only report a completion this view actually watched happen. Re-opening or
    // sharing a finished /r link must not count as a new analysis_completed
    // (or, for a part, part_identification_completed).
    const hasSeenInProgress = useRef(false)
    const hasTrackedCompletion = useRef(false)

    useEffect(() => {
        if (!record) return
        if (record.status === 'identifying' || record.status === 'detecting_products') {
            hasSeenInProgress.current = true
            return
        }
        if (!hasSeenInProgress.current || hasTrackedCompletion.current) return
        hasTrackedCompletion.current = true

        if (isPartRecord(record)) {
            // Same event and parameters the part identifier fired inline; only
            // for a finished identification, as before
            const part = getPartIdentification(record)
            if (!part) return
            import('@/lib/analytics').then(({ trackEvent, getPlatform }) => {
                const outcome = getConfidenceBand(part.confidence).toLowerCase()
                trackEvent('part_identification_completed', { outcome, platform: getPlatform() })
            })
            return
        }

        import('@/lib/analytics').then(({ trackEvent, getPlatform }) => {
            let outcome = 'unknown'
            let catalog_match = false

            if (record.status === 'error') {
                outcome = 'error'
            } else if (record.result_data?.vehicle_present === false) {
                outcome = 'unusable'
            } else {
                Promise.all([
                    import('@/types/analysis'),
                    import('@/data/vehicles/supported-vehicles')
                ]).then(([ { getConfidence, getConfidenceBand }, { resolveVehicleUrl } ]) => {
                    const confidence = getConfidence(record)
                    const band = getConfidenceBand(confidence).toLowerCase()
                    const primary = record.result_data?.primary
                    const hasYearRange = primary?.year?.includes('-')
                    
                    outcome = hasYearRange ? 'partial' : band
                    
                    if (primary && !hasYearRange && primary.year) {
                        const exactYear = parseInt(primary.year, 10)
                        if (!isNaN(exactYear) && resolveVehicleUrl(primary.make, primary.model, exactYear)) {
                            catalog_match = true
                        }
                    }
                    trackEvent('analysis_completed', { outcome, catalog_match, platform: getPlatform() })
                })
                return
            }
            trackEvent('analysis_completed', { outcome, catalog_match, platform: getPlatform() })
        })
    }, [record])

    const [retryError, setRetryError] = useState<string | null>(null)

    const handleRetry = async () => {
        setRetryError(null)
        const res = await fetch(`/api/analyses/${id}/process`, { method: 'POST' })
        if (!res.ok) {
            setRetryError(apiErrorMessage(res.status, await readJson(res), 'Could not restart the analysis. Please try again.'))
            return
        }
        // Allow the retried run to report its own completion
        hasTrackedCompletion.current = false
        hasSeenInProgress.current = true
        setError(null)
        setRecord(prev => prev ? { ...prev, status: 'identifying', error_details: null } : null)
        setIsPolling(true)
    }

    if (error) {
        return (
            <section aria-label="Error" className={cn(stateCardClass, "mx-auto max-w-2xl")}>
                <AlertCircle className="h-10 w-10 text-[#9B1C1C]" aria-hidden="true" />
                <h1 className="font-heading text-xl font-bold text-[#17212B]">Error</h1>
                <p className="text-[15px] text-[#2B3742]">{error}</p>
                <div className="mt-4 w-full max-w-sm text-left">
                    <p className="mb-3 text-sm text-[#5A6672]">Or pick your vehicle manually:</p>
                    <VehicleSelector location="degraded_state" />
                </div>
            </section>
        )
    }

    if (!record) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#C8460F]" aria-label="Loading" />
            </div>
        )
    }

    const { status, image_url } = record
    const isPart = isPartRecord(record)

    if (isPart && (status === 'identifying' || status === 'detecting_products')) {
        return (
            <section aria-label="Identifying your part" className={cn(stateCardClass, "mx-auto max-w-2xl")} aria-live="polite">
                <div className="relative mb-3 aspect-square w-full max-w-[280px] overflow-hidden rounded-xl">
                    <ResultPhoto fit="contain" imageUrl={image_url} alt="Your part photo" className="h-full w-full rounded-xl border-0 opacity-70" />
                    <div className="absolute inset-0 flex items-center justify-center bg-[#17212B]/10">
                        <Loader2 className="h-12 w-12 animate-spin text-white drop-shadow" aria-hidden="true" />
                    </div>
                </div>
                <h1 className="font-heading text-2xl font-bold text-[#17212B]">Identifying your part...</h1>
                <p className="max-w-md text-[15px] text-[#2B3742]">This usually takes 10 to 30 seconds. You can leave this page open.</p>
            </section>
        )
    }

    if (status === 'identifying' || status === 'detecting_products') {
        return (
            <section aria-label="Analyzing your photo" className={cn(stateCardClass, "mx-auto max-w-2xl")} aria-live="polite">
                <div className="relative mb-3 aspect-video w-full max-w-md overflow-hidden rounded-xl">
                    <ResultPhoto fit="contain" imageUrl={image_url} alt="Analyzing" className="h-full w-full rounded-xl border-0 opacity-70" />
                    <div className="absolute inset-0 flex items-center justify-center bg-[#17212B]/10">
                        <Loader2 className="h-12 w-12 animate-spin text-white drop-shadow" aria-hidden="true" />
                    </div>
                </div>
                <h1 className="font-heading text-2xl font-bold text-[#17212B]">
                    {status === 'identifying' ? 'Identifying Vehicle...' : 'Detecting Products...'}
                </h1>
                <p className="max-w-md text-[15px] text-[#2B3742]">
                    Our AI is scanning your photo. This usually takes about 15 to 30 seconds.
                </p>
            </section>
        )
    }

    if (isPart && status === 'error') {
        return (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
                <section aria-label="Identification error" className={stateCardClass}>
                    <ResultPhoto fit="contain" imageUrl={image_url} alt="Your part photo" className="mb-2 h-24 w-24" />
                    <h1 className="font-heading text-xl font-bold text-[#17212B]">That identification didn&apos;t finish.</h1>
                    <button type="button" onClick={handleRetry} className={cn(primaryButtonClass, "mt-2 w-auto px-6")}>
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Try again
                    </button>
                    {retryError && <p className="text-sm text-[#9B1C1C]">{retryError}</p>}
                    <Link
                        href="/part-identifier"
                        className="flex min-h-11 items-center text-sm font-semibold text-[#9A3412] underline-offset-2 hover:text-[#7C2D12] hover:underline"
                    >
                        Back to the part identifier
                    </Link>
                </section>
                <ResultNoticesFooter />
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
                <section aria-label="Analysis error" className={stateCardClass}>
                    <AlertCircle className="h-10 w-10 text-[#9B1C1C]" aria-hidden="true" />
                    <h1 className="font-heading text-xl font-bold text-[#17212B]">Something went wrong on our end.</h1>
                    <p className="max-w-md text-[15px] text-[#2B3742]">
                        That analysis didn&apos;t finish. Give it another try, or pick your vehicle to keep going.
                    </p>
                    <button type="button" onClick={handleRetry} className={cn(primaryButtonClass, "mt-2 w-auto px-6")}>
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Try again
                    </button>
                    {retryError && <p className="text-sm text-[#9B1C1C]">{retryError}</p>}
                    <div className="mt-4 w-full max-w-md border-t border-[#E4EBF0] pt-6 text-left">
                        <p className="mb-3 text-sm font-semibold text-[#17212B]">Or pick your vehicle</p>
                        <VehicleSelector location="degraded_state" />
                    </div>
                </section>
                <ResultNoticesFooter />
            </div>
        )
    }

    if (isPart) {
        const part = getPartIdentification(record)
        if (part) return <PartResultView part={part} imageUrl={image_url} />
        // A finished row without a readable identification: nothing to show
        return (
            <section aria-label="Identification error" className={cn(stateCardClass, "mx-auto max-w-2xl")}>
                <h1 className="font-heading text-xl font-bold text-[#17212B]">That identification didn&apos;t finish.</h1>
                <Link href="/part-identifier" className={cn(primaryButtonClass, "mt-2 w-auto px-6")}>
                    Back to the part identifier
                </Link>
            </section>
        )
    }

    // Complete state: check for unusable photo
    // Default to true for backward compatibility with old records
    const vehiclePresent = record.result_data?.vehicle_present !== false

    if (!vehiclePresent) {
        return (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
                <section aria-label="No vehicle found" className={stateCardClass}>
                    <ResultPhoto fit="contain" imageUrl={image_url} alt="Uploaded photo" className="mb-3 aspect-video h-auto w-full max-w-md opacity-75" />
                    <h1 className="font-heading text-xl font-bold text-[#17212B]">That&apos;s a great photo, but we don&apos;t see a vehicle in it.</h1>
                    <p className="max-w-md text-[15px] text-[#2B3742]">
                        Upload a clear shot of a car or truck and we&apos;ll break down what&apos;s on it.
                    </p>
                    <Link href="/#upload-zone" className={cn(primaryButtonClass, "mt-2 w-auto px-6")}>
                        Try another photo
                    </Link>
                    <p className="mt-1 max-w-xs text-xs text-[#5A6672]">
                        Tips for a good photo: ensure the vehicle is clearly visible, well-lit, and occupies most of the frame. Avoid heavy filters.
                    </p>
                </section>
                <ResultNoticesFooter />
            </div>
        )
    }

    // Hand off to ResultLayout for Low/Medium/High/Partial display
    return <ResultLayout record={record} />
}
