"use client"

import type { PartIdentification } from "@/app/actions"
import { eyebrowClass, MatchPill, ResultPhoto } from "@/components/results/result-shell"
import {
    SampleCaption,
    SampleCardLink,
    SampleChip,
    SampleEyebrow,
    SampleLabel,
    SampleSeeFull,
    SampleShopLabel,
    SampleTitle,
} from "@/components/results/sample-result-card"
import { PART_BAND_PILL } from "@/components/home/part-result"
import { getPartDisplayBand } from "@/config/analysis"
import { detectedVehicleLabel } from "@/lib/part-vehicle"

export interface PartSample {
    /** The /r/ id of the real result this sample copies. */
    id: string
    imageUrl: string
    part: PartIdentification
}

const MAX_RELATED = 3

/** "an engine piston", "a fuel injector" */
function withArticle(name: string) {
    const lower = name.toLowerCase()
    return `${/^[aeiou]/.test(lower) ? "an" : "a"} ${lower}`
}

/**
 * /part-identifier sample: a compact part result built from static data.
 * The whole card links to /r/{id}. Side by side with the upload card from
 * lg (1024px); below it on narrower screens.
 */
export function PartSampleCard({ sample }: { sample: PartSample }) {
    const { part } = sample
    const pill = PART_BAND_PILL[getPartDisplayBand(part.confidence)]
    // The vehicle the real result's shop button is for when it opens
    const vehicle = detectedVehicleLabel(part)
    const related = (part.relatedParts ?? []).filter(item => item.trim() !== "").slice(0, MAX_RELATED)
    const buyingCheck = part.buyingCheck?.trim() || null

    return (
        <div className="flex flex-col gap-2.5">
            <SampleEyebrow className="text-center lg:text-left" />

            <SampleCardLink
                href={`/r/${sample.id}`}
                ariaLabel={`See the full sample result for ${withArticle(part.partName)}`}
                page="part_identifier"
                className="flex flex-col gap-3 p-4 lg:p-5"
            >
                <div className="flex items-start gap-3 lg:gap-3.5">
                    <ResultPhoto
                        imageUrl={sample.imageUrl}
                        alt={`Sample photo of ${withArticle(part.partName)}`}
                        sizes="96px"
                        className="h-[76px] w-[76px] lg:h-24 lg:w-24"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                        <span className={eyebrowClass}>{part.category}</span>
                        <SampleTitle className="text-[22px] leading-[1.1] lg:text-[26px]">{part.partName}</SampleTitle>
                        <MatchPill tone={pill.tone}>{pill.label} · {part.confidence}%</MatchPill>
                    </div>
                </div>
                <p className="text-sm leading-[1.45] text-[#2B3742]">{part.function}</p>

                <div className="flex flex-col gap-2 rounded-xl border-2 border-[#C8460F] p-3">
                    <SampleShopLabel className="flex min-h-11 items-center justify-center rounded-[10px] px-3 text-center text-sm">
                        {vehicle ? `Shop ${part.partName} for ${vehicle}` : `Shop ${part.partName}`}
                    </SampleShopLabel>
                    {buyingCheck && (
                        <span className="rounded-lg bg-[#FFF8E6] px-2.5 py-2 text-xs leading-[1.45] text-[#5C3A00] lg:hidden">
                            <strong>Before you buy:</strong> {buyingCheck}
                        </span>
                    )}
                    {related.length > 0 && (
                        <>
                            <SampleLabel className="text-xs">Often replaced at the same time</SampleLabel>
                            <div className="flex flex-wrap gap-1.5">
                                {related.map(item => <SampleChip key={item}>{item}</SampleChip>)}
                            </div>
                        </>
                    )}
                </div>

                <SampleSeeFull wideFrom="lg" />
            </SampleCardLink>

            <SampleCaption className="text-center lg:text-left" />
        </div>
    )
}
