"use client"

import { forwardRef, useRef } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { SaveToGarageButton } from "@/components/save-to-garage-button"
import {
    AFFILIATE_LINK_PROPS,
    AiDisclaimer,
    cardClass,
    CommissionNote,
    MatchPill,
    ResultGrid,
    ResultHeaderCard,
    resultLeftColumn,
    resultSidePanel,
    stickyActionClass,
    StickyResultBar,
    type MatchTone,
} from "@/components/results/result-shell"
import type { AnalysisResults, DetectedProduct } from "@/app/actions"
import type { AnalysisDetectedProduct, AnalysisRecord } from "@/types/analysis"
import { getConfidence, getConfidenceBand, type ConfidenceBand } from "@/types/analysis"
import { formatVehicleType, parseRecommendation, vehicleNoun, vehicleSpecLine, vehicleTitle } from "@/lib/vehicle-result"
import { getEntryDoor, getPlatform, trackEvent } from "@/lib/analytics"
import { cn } from "@/lib/utils"

const BAND_TONE: Record<ConfidenceBand, MatchTone> = { High: "high", Medium: "medium", Low: "low" }
const BAND_TEXT_CLASS: Record<ConfidenceBand, string> = {
    High: "text-[#116B3C]",
    Medium: "text-[#7A4B00]",
    Low: "text-[#9B1C1C]",
}

export interface YearChoice {
    /** Every year in the range the record was identified with. */
    years: number[]
    selected: number | null
    status: "idle" | "saving" | "error"
    onSelect: (year: number) => void
}

export interface CatalogLink {
    href: string
    label: string
    model: string
}

interface AnalysisResultsViewProps {
    record: AnalysisRecord
    /** Year chips, while the record's year is (or this view narrowed it from) a range. */
    yearChoice?: YearChoice | null
    /** Curated catalog page for this vehicle's generation, when there is one. */
    catalog?: CatalogLink | null
    /** Medium confidence: "Is this your vehicle?" row in the header card. */
    verify?: { onConfirm: () => void; onChange: () => void } | null
    /** Opens the Year/Make/Model selector instead of this result. */
    onPickVehicle: () => void
}

/** Vehicle result: header card, what's on it, then the shop panel. */
export function AnalysisResultsView({ record, yearChoice, catalog, verify, onPickVehicle }: AnalysisResultsViewProps) {
    const detectedRef = useRef<HTMLElement>(null)
    const resultData = record.result_data
    if (!resultData?.primary) return null

    const { primary, engineDetails, otherPossibilities, recommendedAccessories, tieredRecommendations } = resultData
    const detectedProducts = record.detected_products ?? []

    // Authoritative confidence from resolver
    const band = getConfidenceBand(getConfidence(record))
    const noun = vehicleNoun(primary.vehicleType)
    const categoryLabel = formatVehicleType(primary.vehicleType) ?? "Vehicle"

    // Vehicle string for /go links, and the title
    const vehicleString = vehicleTitle(primary)

    const specLine = vehicleSpecLine(primary, engineDetails)

    const fields = [
        { label: "Year", value: primary.year },
        { label: "Make", value: primary.make },
        { label: "Model", value: primary.model },
        { label: "Trim", value: primary.trim },
        { label: "Cab", value: primary.cabStyle },
        { label: "Bed", value: primary.bedLength },
    ].filter(field => field.value)

    const tiers = tieredRecommendations && tieredRecommendations.length > 0
        ? tieredRecommendations
        : [{ title: null as string | null, items: recommendedAccessories ?? [] }]
    const hasRecommendations = tiers.some(tier => tier.items.length > 0)
    const recommendedFor = [primary.year, primary.model, primary.trim].filter(Boolean).join(" ")
    const possibilities = (otherPossibilities ?? []).filter(p => p.vehicle?.trim())
    const showPanel = hasRecommendations || Boolean(yearChoice) || Boolean(catalog)

    const trackCatalogClick = () => trackEvent("results_catalog_click", { entry_door: getEntryDoor(), platform: getPlatform() })

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#5A6672]">Your result</p>
                <Link
                    href="/#upload-zone"
                    className="flex min-h-11 items-center text-sm font-semibold text-[#9A3412] hover:text-[#7C2D12]"
                >
                    Analyze another vehicle
                </Link>
            </div>

            <ResultGrid
                after={detectedProducts.length > 0 && (
                    <StickyResultBar
                        imageUrl={record.image_url}
                        imageAlt="Your vehicle photo"
                        title={vehicleString}
                        watchRef={detectedRef}
                        action={catalog ? (
                            <Link href={catalog.href} onClick={trackCatalogClick} className={stickyActionClass}>
                                See {catalog.label} picks
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => detectedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                className={stickyActionClass}
                            >
                                Shop what&apos;s on it
                            </button>
                        )}
                    />
                )}
            >
                <ResultHeaderCard
                    ariaLabel="Identified vehicle"
                    photo="banner"
                    imageUrl={record.image_url}
                    imageAlt="Your vehicle photo"
                    eyebrow={categoryLabel}
                    title={vehicleString}
                    titleAs="h1"
                    pill={<MatchPill tone={BAND_TONE[band]}>{band} match</MatchPill>}
                    summary={specLine}
                    className={resultLeftColumn}
                >
                    {fields.length > 0 && (
                        <dl className="grid grid-cols-3 gap-x-2 gap-y-3 border-t border-[#E4EBF0] pt-3 @md/header-body:grid-cols-6">
                            {fields.map(field => (
                                <div key={field.label} className="min-w-0">
                                    <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5A6672]">{field.label}</dt>
                                    <dd className="mt-0.5 break-words text-[15px] font-semibold text-[#17212B] @md/header-body:text-sm">{field.value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    {verify && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-[#FFF8E6] px-3 py-2">
                            <p className="text-sm font-semibold text-[#5C3A00]">Is this your vehicle?</p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={verify.onConfirm}
                                    className="min-h-11 rounded-[10px] border-[1.5px] border-[#17212B] bg-white px-4 text-sm font-semibold text-[#17212B] hover:bg-[#F4F7F9]"
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={verify.onChange}
                                    className="min-h-11 rounded-[10px] border-[1.5px] border-[#D5DEE5] bg-white px-4 text-sm font-semibold text-[#17212B] hover:bg-[#F4F7F9]"
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    )}
                </ResultHeaderCard>

                {/* Narrow results: its own card under the header. Wide: inside the shop panel. */}
                {yearChoice && (
                    <ExactYearPicker
                        choice={yearChoice}
                        noun={noun}
                        vehicleString={vehicleString}
                        className={cn(resultLeftColumn, "border-2 border-[#C8460F] @2xl:hidden")}
                        showTitle
                    />
                )}

                {detectedProducts.length > 0 && (
                    <DetectedProducts
                        ref={detectedRef}
                        products={detectedProducts}
                        noun={noun}
                        vehicleString={vehicleString}
                        // Wide results show the note once, in the shop panel
                        noteInPanel={showPanel}
                        className={resultLeftColumn}
                    />
                )}

                {showPanel && (
                    <aside
                        aria-label={`Shop for your ${primary.model}`}
                        className={cn(
                            cardClass,
                            "flex flex-col gap-3.5 @2xl:border-2 @2xl:border-[#C8460F] @2xl:p-5",
                            resultSidePanel
                        )}
                    >
                        <p className="hidden font-heading text-xl font-bold text-[#17212B] @2xl:block">Shop for your {primary.model}</p>

                        {yearChoice && (
                            <ExactYearPicker
                                choice={yearChoice}
                                noun={noun}
                                vehicleString={vehicleString}
                                className="hidden border-0 p-0 @2xl:flex"
                            />
                        )}

                        {catalog && (
                            <Link
                                href={catalog.href}
                                onClick={trackCatalogClick}
                                className="flex min-h-[52px] w-full flex-col items-center justify-center rounded-xl bg-[#C8460F] px-3 py-2 text-center text-base font-semibold text-white transition-colors hover:bg-[#AD3C0C]"
                            >
                                See parts picked for the {catalog.label} {catalog.model}
                                <span className="text-xs font-medium text-white/90">Fitment-checked, with caveats by cab and bed</span>
                            </Link>
                        )}

                        {hasRecommendations && (
                            <div className="flex flex-col gap-1.5">
                                <p className="text-[15px] font-semibold text-[#17212B] @2xl:text-[13px] @2xl:text-[#5A6672]">
                                    Recommended for your {recommendedFor}
                                </p>
                                {tiers.filter(tier => tier.items.length > 0).map((tier, tierIndex) => (
                                    <div key={tier.title ?? tierIndex} className="flex flex-col gap-1.5">
                                        {tier.title && (
                                            <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[#5A6672]">{tier.title}</p>
                                        )}
                                        <ul className="flex flex-col gap-1.5 @2xl:gap-0">
                                            {tier.items.map((accessory, index) => {
                                                const { name, description } = parseRecommendation(accessory)
                                                const categorySlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                                                const redirectUrl = `/go?cat=${encodeURIComponent(categorySlug)}&vehicle=${encodeURIComponent(vehicleString)}&product=${encodeURIComponent(name)}&source=recommended-accessories`
                                                return (
                                                    <li key={index}>
                                                        <a
                                                            href={redirectUrl}
                                                            {...AFFILIATE_LINK_PROPS}
                                                            className="flex min-h-14 items-center justify-between gap-2.5 rounded-[10px] border border-[#D5DEE5] px-3 py-2.5 text-[#17212B] transition-colors hover:bg-[#F4F7F9] @2xl:min-h-[52px] @2xl:rounded-none @2xl:border-0 @2xl:border-b @2xl:border-[#E4EBF0] @2xl:px-0"
                                                        >
                                                            <span className="flex min-w-0 flex-col gap-0.5">
                                                                <span className="text-[15px] font-semibold @2xl:text-sm">{name}</span>
                                                                {description && <span className="text-xs text-[#5A6672]">{description}</span>}
                                                            </span>
                                                            <span className="shrink-0 text-[13px] font-semibold text-[#9A3412]">Shop</span>
                                                        </a>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Narrow results already show the note in "What's on this truck" */}
                        <CommissionNote className={cn(detectedProducts.length > 0 && "hidden @2xl:block")} />
                    </aside>
                )}

                {possibilities.length > 0 && (
                    <section
                        aria-label="Other possibilities"
                        className={cn(
                            cardClass,
                            "flex flex-col gap-2 @2xl:flex-row @2xl:flex-wrap @2xl:items-center @2xl:gap-x-6 @2xl:gap-y-2 @2xl:px-6 @2xl:py-5",
                            resultLeftColumn
                        )}
                    >
                        <p className="text-[15px] font-semibold text-[#17212B]">Not quite right? It could also be</p>
                        <ul className="flex flex-col @2xl:flex-row @2xl:flex-wrap @2xl:gap-x-6 @2xl:gap-y-2">
                            {possibilities.map((item, index) => {
                                const pBand = getConfidenceBand(item.confidence)
                                return (
                                    <li
                                        key={index}
                                        className="flex min-h-11 items-center justify-between gap-3 border-t border-[#E4EBF0] text-sm text-[#17212B] @2xl:min-h-0 @2xl:justify-start @2xl:border-t-0"
                                    >
                                        <span>
                                            {item.vehicle}
                                            {item.yearRange && <span className="text-[#5A6672]"> ({item.yearRange})</span>}
                                        </span>
                                        <span className={cn("text-xs font-semibold", BAND_TEXT_CLASS[pBand])}>{pBand}</span>
                                    </li>
                                )
                            })}
                        </ul>
                        <button
                            type="button"
                            onClick={onPickVehicle}
                            className="flex min-h-11 items-center self-start text-sm font-semibold text-[#9A3412] underline-offset-2 hover:text-[#7C2D12] hover:underline @2xl:self-center"
                        >
                            Pick my vehicle instead
                        </button>
                    </section>
                )}

                <div className={resultLeftColumn}>
                    <SaveToGarageButton
                        vehicleImageUrl={record.image_url}
                        // The pipeline stores the same validated results and products the inline analyzer saves
                        results={resultData as unknown as AnalysisResults}
                        detectedProducts={detectedProducts as DetectedProduct[]}
                        variant="outline"
                        className="mt-0 sm:mt-0 h-12 w-full sm:w-full rounded-xl border-[1.5px] border-[#D5DEE5] bg-white text-[15px] font-semibold text-[#17212B] shadow-none hover:bg-[#F4F7F9] hover:text-[#17212B] @2xl:h-11 @2xl:w-auto @2xl:px-4 @2xl:text-sm"
                    />
                </div>

                <AiDisclaimer className={resultLeftColumn} />
            </ResultGrid>
        </div>
    )
}

/** Year chips. Tapping one narrows the record (PATCH) so every /go link searches for that year. */
function ExactYearPicker({ choice, noun, vehicleString, showTitle, className }: {
    choice: YearChoice
    noun: "truck" | "vehicle"
    vehicleString: string
    showTitle?: boolean
    className?: string
}) {
    const { years, selected, status, onSelect } = choice
    const start = years[0]
    const end = years[years.length - 1]
    const locked = selected !== null || status === "saving"

    return (
        <section aria-label="Your exact year" className={cn(cardClass, "flex flex-col gap-2.5", className)}>
            {showTitle && (
                <p className="font-heading text-lg font-bold text-[#17212B]">Match every link to your exact {noun}</p>
            )}
            <p className="text-sm leading-[1.45] text-[#2B3742]">
                We narrowed it to {start} to {end}. Tap your year and every shopping link on this page searches for it.
            </p>
            <div className="flex flex-wrap gap-2">
                {years.map(year => {
                    const isSelected = year === selected
                    return (
                        <button
                            key={year}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={locked && !isSelected}
                            onClick={() => !locked && onSelect(year)}
                            className={cn(
                                "flex min-h-11 min-w-16 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors",
                                isSelected
                                    ? "border-2 border-[#17212B] bg-[#17212B] text-white"
                                    : "border border-[#B9C5CF] bg-white text-[#17212B] enabled:hover:bg-[#F4F7F9] disabled:text-[#8A96A1]"
                            )}
                        >
                            {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
                            {year}
                        </button>
                    )
                })}
            </div>
            {status === "saving" && <p className="text-[13px] text-[#5A6672]" role="status">Updating your links...</p>}
            {status === "error" && (
                <p className="text-[13px] text-[#9B1C1C]" role="alert">We couldn&apos;t update the year. Please try again.</p>
            )}
            {selected !== null && status === "idle" && (
                <div className="flex items-center gap-2 rounded-[10px] bg-[#F0FAF4] px-3 py-2.5" role="status">
                    <Check className="h-4 w-4 shrink-0 text-[#116B3C]" strokeWidth={2.5} aria-hidden="true" />
                    <span className="text-[13px] text-[#0E5A32]">
                        {showTitle ? "Links below now search for a" : "Links now search for a"} <strong>{vehicleString}</strong>.
                    </span>
                </div>
            )}
        </section>
    )
}

/** "What's on this truck": one row per detected product, each with a "Find it" link. */
const DetectedProducts = forwardRef<HTMLElement, {
    products: AnalysisDetectedProduct[]
    noun: "truck" | "vehicle"
    vehicleString: string
    noteInPanel: boolean
    className?: string
}>(function DetectedProducts({ products, noun, vehicleString, noteInPanel, className }, ref) {
    return (
        <section
            ref={ref}
            aria-label={`What's on this ${noun}`}
            className={cn(cardClass, "flex scroll-mt-20 flex-col gap-1.5 @2xl:p-6", className)}
        >
            <p className="font-heading text-[19px] font-bold text-[#17212B] @2xl:text-xl">What&apos;s on this {noun}</p>
            <p className="mb-1 text-[13px] text-[#5A6672] @2xl:mb-2 @2xl:text-sm">
                Parts and accessories we spotted in your photo. Tap to find them for your {noun}.
            </p>
            <ul className="flex flex-col @2xl:grid @2xl:grid-cols-2 @2xl:gap-2.5">
                {products.map((item, index) => {
                    const itemBand = getConfidenceBand(item.confidence)
                    const isUnknownBrand = !item.brand || item.brand.toLowerCase().includes("unknown")
                    const isUnknownModel = !item.model || item.model.toLowerCase().includes("unknown")

                    const categorySlug = item.type.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                    const brandString = isUnknownBrand ? "" : item.brand
                    // Unknown model: search by product type so the Amazon link isn't a bare vehicle search
                    const modelString = isUnknownModel ? item.type : item.model
                    const redirectUrl = `/go?cat=${encodeURIComponent(categorySlug)}&vehicle=${encodeURIComponent(vehicleString)}&brand=${encodeURIComponent(brandString)}&product=${encodeURIComponent(modelString)}&source=detected-products`
                    const brandModel = [isUnknownBrand ? null : item.brand, isUnknownModel ? null : item.model].filter(Boolean).join(" ")

                    return (
                        <li
                            key={index}
                            className="flex items-center justify-between gap-2.5 border-t border-[#E4EBF0] py-3 @2xl:rounded-xl @2xl:border @2xl:px-3.5"
                        >
                            <div className="flex min-w-0 flex-col gap-[3px]">
                                <span className="text-[15px] font-semibold text-[#17212B]">{item.type}</span>
                                {brandModel && <span className="text-[13px] text-[#2B3742]">{brandModel}</span>}
                                {(isUnknownBrand || isUnknownModel) && (
                                    <span className="text-[13px] italic text-[#5A6672]">
                                        We detected {item.type.toLowerCase()} on your vehicle but could not identify the exact brand or model
                                    </span>
                                )}
                                <MatchPill tone={BAND_TONE[itemBand]} size="sm">{itemBand} match</MatchPill>
                            </div>
                            <a
                                href={redirectUrl}
                                {...AFFILIATE_LINK_PROPS}
                                aria-label={`Find it: ${item.type}`}
                                className="flex min-h-11 shrink-0 items-center rounded-[10px] bg-[#C8460F] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#AD3C0C]"
                            >
                                Find it
                            </a>
                        </li>
                    )
                })}
            </ul>
            <CommissionNote className={cn("mt-1", noteInPanel && "@2xl:hidden")} />
        </section>
    )
})
