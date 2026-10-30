"use client"

import { sampleAnalysisRecord } from "@/data/sample-analysis"
import { MatchPill, eyebrowClass, ResultPhoto, type MatchTone } from "@/components/results/result-shell"
import {
    SampleCaption,
    SampleCardLink,
    SampleChip,
    SampleEyebrow,
    SampleItemRow,
    SampleLabel,
    SampleSeeFull,
    SampleTitle,
} from "@/components/results/sample-result-card"
import { getConfidenceBand, type ConfidenceBand } from "@/types/analysis"
import { formatVehicleType, parseRecommendation, vehicleNoun, vehicleSpecLine, vehicleTitle } from "@/lib/vehicle-result"
import { cn } from "@/lib/utils"

const BAND_TONE: Record<ConfidenceBand, MatchTone> = { High: "high", Medium: "medium", Low: "low" }

/** Rows shown: 3 on narrow screens, 4 from md up. */
const NARROW_ROWS = 3
const WIDE_ROWS = 4
const WIDE_CHIPS = 3

/**
 * Homepage sample: a compact vehicle result built from static data (no
 * request on load besides the photo). The whole card links to /r/{id}.
 */
export function SampleResultPreview() {
    const record = sampleAnalysisRecord
    const resultData = record.result_data
    const primary = resultData?.primary
    if (!primary) return null

    const band = getConfidenceBand(primary.confidence)
    const title = vehicleTitle(primary)
    const noun = vehicleNoun(primary.vehicleType)
    const specLine = vehicleSpecLine(primary, resultData.engineDetails)

    // Highest confidence first; the sort is stable, so ties keep the data's order
    const products = [...(record.detected_products ?? [])].sort((a, b) => b.confidence - a.confidence)
    const recommendations = (resultData.tieredRecommendations?.flatMap(t => t.items) ?? resultData.recommendedAccessories ?? [])
        .map(text => parseRecommendation(text).name)

    const moreNarrow = Math.max(0, products.length - NARROW_ROWS)
    const moreWide = Math.max(0, products.length - WIDE_ROWS)
    const moreChips = Math.max(0, recommendations.length - WIDE_CHIPS)

    // "+4 more spotted, plus 4 recommended accessories"
    const narrowSummary = [
        moreNarrow > 0 ? `+${moreNarrow} more spotted` : null,
        recommendations.length > 0
            ? `${moreNarrow > 0 ? "plus" : "Plus"} ${recommendations.length} recommended ${recommendations.length === 1 ? "accessory" : "accessories"}`
            : null,
    ].filter(Boolean).join(", ")

    return (
        <div id="sample-result-preview" className="mx-auto flex w-full max-w-5xl flex-col gap-2.5 px-4 pb-10">
            <SampleEyebrow className="text-center md:text-left" />

            <SampleCardLink
                href={`/r/${record.id}`}
                ariaLabel={`See the full sample result for a ${title}`}
                page="homepage"
                className="flex flex-col overflow-hidden md:flex-row md:gap-5 md:p-5"
            >
                {/* The vehicle */}
                <div className="flex flex-col md:min-w-0 md:flex-1 md:gap-3">
                    <ResultPhoto
                        imageUrl={record.image_url}
                        alt={`Sample photo of a ${title}`}
                        sizes="(min-width: 1024px) 480px, (min-width: 768px) 45vw, 100vw"
                        className="h-[170px] w-full rounded-none border-0 md:h-[200px] md:rounded-xl"
                    />
                    <div className="flex flex-col gap-2 px-4 pt-4 md:p-0">
                        <span className={eyebrowClass}>{formatVehicleType(primary.vehicleType) ?? "Vehicle"}</span>
                        <SampleTitle className="text-[22px] md:text-[26px]">{title}</SampleTitle>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                            <MatchPill tone={BAND_TONE[band]}>{band} match</MatchPill>
                            {specLine && <span className="text-[13px] text-[#2B3742] md:text-sm">{specLine}</span>}
                        </div>
                        <p className="hidden text-xs text-[#5A6672] md:block">Example from one uploaded photo</p>
                    </div>
                </div>

                {/* What a result offers */}
                <div className="mx-4 mt-3 flex flex-col border-t border-[#E4EBF0] pt-2.5 md:m-0 md:min-w-0 md:flex-1 md:rounded-[14px] md:border-2 md:border-[#C8460F] md:p-4">
                    <SampleLabel className="mb-1 md:font-heading md:text-[17px] md:font-bold md:text-[#17212B]">
                        What&apos;s on this {noun}
                    </SampleLabel>
                    <ul className="flex flex-col">
                        {products.slice(0, WIDE_ROWS).map((item, index) => {
                            const known = (value: string) => value && !value.toLowerCase().includes("unknown")
                            const detail = [item.brand, item.model].filter(known).join(" ") || null
                            return (
                                <SampleItemRow
                                    key={index}
                                    title={item.type}
                                    detail={detail}
                                    className={cn(index >= NARROW_ROWS && "hidden md:flex")}
                                />
                            )
                        })}
                    </ul>
                    {narrowSummary && <p className="mt-1.5 text-xs text-[#5A6672] md:hidden">{narrowSummary}</p>}
                    {moreWide > 0 && <p className="mt-1 hidden text-xs text-[#5A6672] md:block">+{moreWide} more spotted</p>}

                    {recommendations.length > 0 && (
                        <div className="mt-3 hidden flex-col gap-1.5 md:flex">
                            <SampleLabel>Recommended for this {noun}</SampleLabel>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {recommendations.slice(0, WIDE_CHIPS).map(name => <SampleChip key={name}>{name}</SampleChip>)}
                                {moreChips > 0 && <span className="text-xs text-[#5A6672]">+{moreChips} more</span>}
                            </div>
                        </div>
                    )}

                    <div className="mt-3 mb-4 flex flex-col md:mb-0 md:mt-auto">
                        <SampleSeeFull wideFrom="md" />
                    </div>
                </div>
            </SampleCardLink>

            <SampleCaption className="text-center md:hidden" />
        </div>
    )
}
