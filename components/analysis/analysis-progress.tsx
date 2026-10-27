"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Hash } from "lucide-react"
import {
    cardClass,
    eyebrowClass,
    MATCH_TONE_CLASS,
    MatchPill,
    outlineButtonClass,
    ResultGrid,
    resultLeftColumn,
    ResultPhoto,
    resultSidePanel,
    type MatchTone,
} from "@/components/results/result-shell"
import type { AnalysisKind, AnalysisRecord, ConfidenceBand } from "@/types/analysis"
import { getConfidence, getConfidenceBand } from "@/types/analysis"
import { formatVehicleType, vehicleNoun, vehicleTitle } from "@/lib/vehicle-result"
import { cn } from "@/lib/utils"

/**
 * The /r/[id] screen while an analysis runs, and on the first fetch
 * (record null). Steps move only on a real status; the copy changes only
 * when the run passes 60 seconds (`slow`, worked out by AnalysisView).
 * Laid out on the result grid so the result fills in where this was.
 */

type StepState = "done" | "active" | "pending"
interface Step {
    label: string
    state: StepState
    detail?: string
}

/** What each check is actually asked to look at; rotated on the photo. */
const PART_CHECKS = ["Checking the shape", "Reading logos and markings", "Looking for a part number", "Matching vehicles it fits"]
const PART_VERIFY_CHECKS = ["Comparing close matches"]
const VEHICLE_CHECKS = ["Reading the grille and badges", "Checking the body and bed", "Narrowing the year range"]

const COPY = {
    part: {
        eyebrow: "Part Identifier",
        title: "Identifying your part",
        lead: "Most parts take 10 to 30 seconds.",
        photoAlt: "Your part photo",
        tips: ["Fill the frame with the part", "Show any stamped part number", "Good light, no filters"],
        retryHref: "/part-identifier",
    },
    vehicle: {
        eyebrow: "Vehicle Analyzer",
        title: "Identifying your vehicle",
        lead: "Most photos take 15 to 30 seconds.",
        photoAlt: "Your vehicle photo",
        tips: ["Get the whole vehicle in frame", "Shoot from a front or rear corner", "Good light, no filters"],
        retryHref: "/#upload-zone",
    },
} as const

const BAND_TONE: Record<ConfidenceBand, MatchTone> = { High: "high", Medium: "medium", Low: "low" }

const titleClass = "font-heading text-[26px] font-bold leading-[1.15] text-[#17212B] @2xl:text-[32px] @2xl:leading-[1.1]"
const bodyClass = "text-[15px] leading-snug text-[#2B3742]"
/** Label above a placeholder ("Your shopping links will appear here"). */
const placeholderLabelClass = "text-[13px] font-semibold text-[#9A3412]"
const shimmerClass =
    "rounded-md bg-[linear-gradient(90deg,#E4EBF0_25%,#F4F7F9_50%,#E4EBF0_75%)] bg-[length:200%_100%] animate-vf-shimmer motion-reduce:animate-none"

function progressSteps(kind: AnalysisKind, status: AnalysisRecord["status"] | null): Step[] {
    const started = status !== null
    const first = (label: string, detail: string): Step[] => [
        { label: "Photo received", state: started ? "done" : "pending" },
        { label, state: started ? "active" : "pending", detail },
    ]

    if (kind === "part") {
        const building: Step = { label: "Building your shopping links", state: "pending" }
        if (status === "verifying") {
            return [
                { label: "Photo received", state: "done" },
                { label: "First look done", state: "done" },
                {
                    label: "Taking a closer look",
                    state: "active",
                    detail: "This one gets a second, more careful check before we show it. That usually means a better match.",
                },
                building,
            ]
        }
        return [...first("Identifying the part", "Shape, logos and markings, and any stamped number"), building]
    }

    const building: Step = { label: "Building your shopping links", state: "pending" }
    if (status === "detecting_products") {
        return [
            { label: "Photo received", state: "done" },
            { label: "Vehicle identified", state: "done" },
            { label: "Spotting parts and accessories on it", state: "active", detail: "Wheels, tires, lift, bed cover, lights and more" },
            building,
        ]
    }
    return [
        ...first("Identifying the vehicle", "Year, make, model and trim"),
        { label: "Spotting parts and accessories on it", state: "pending" },
        building,
    ]
}

export function AnalysisProgress({ kind, record, slow }: {
    kind: AnalysisKind
    /** Null on the first fetch: empty photo frame, every step pending. */
    record: AnalysisRecord | null
    /** Past 60 seconds: "Still working on it" and the different-photo card. */
    slow: boolean
}) {
    const status = record?.status ?? null
    const copy = COPY[kind]
    const steps = progressSteps(kind, status)

    // Vehicle found early: show it, unless the result will ask the visitor to
    // confirm it first (low match) or found no vehicle at all
    const primary = kind === "vehicle" && status === "detecting_products" && record?.result_data?.vehicle_present !== false
        ? record?.result_data?.primary
        : undefined
    const band = primary && record ? getConfidenceBand(getConfidence(record)) : null
    const found = primary && band && band !== "Low" ? { primary, band } : null

    const checks = !record
        ? null
        : kind === "part"
            ? status === "verifying" ? PART_VERIFY_CHECKS : PART_CHECKS
            : status === "identifying" ? VEHICLE_CHECKS : null

    const heading = slow ? "Still working on it" : copy.title
    const body = slow ? (
        "This one is taking longer than usual. Keep this page open and we'll show the result as soon as it's ready."
    ) : (
        <>
            {copy.lead} Your result opens right here, and it will be waiting if you switch{" "}
            <span className="@2xl:hidden">apps</span>
            <span className="hidden @2xl:inline">tabs</span>.
        </>
    )

    const photo = (
        <ScanPhoto
            imageUrl={record?.image_url}
            alt={copy.photoAlt}
            scanning={!found}
            checks={checks}
            found={Boolean(found)}
            className={kind === "part" ? "h-[260px] @2xl:h-[340px]" : "h-[200px] @2xl:h-[340px]"}
        />
    )

    const statusCard = (
        <section aria-label={heading} className={cn(cardClass, "grid gap-4 @2xl:grid-cols-2 @2xl:gap-6 @2xl:p-6", resultLeftColumn)}>
            {photo}
            <div className="flex min-w-0 flex-col gap-2 @2xl:justify-center">
                <span className={eyebrowClass}>{copy.eyebrow}</span>
                <h1 className={titleClass}>{heading}</h1>
                <p className={bodyClass}>{body}</p>
                <div className="mt-2 border-t border-[#E4EBF0] pt-4">
                    <StepList steps={steps} />
                </div>
            </div>
        </section>
    )

    if (kind === "part") {
        return (
            <ResultGrid>
                {statusCard}
                {slow ? (
                    <DifferentPhotoCard tips={copy.tips} href={copy.retryHref} className={resultSidePanel} />
                ) : (
                    <>
                        <WaitTip className={resultLeftColumn} />
                        <PartShopSkeleton className={resultSidePanel} />
                    </>
                )}
            </ResultGrid>
        )
    }

    return (
        <ResultGrid>
            {found ? (
                <>
                    <section aria-label="Identified vehicle" className={cn(cardClass, "grid gap-4 @2xl:grid-cols-2 @2xl:gap-6 @2xl:p-6", resultLeftColumn)}>
                        {photo}
                        <div className="flex min-w-0 flex-col gap-2.5 @2xl:justify-center">
                            <span className={eyebrowClass}>{formatVehicleType(found.primary.vehicleType) ?? "Vehicle"}</span>
                            <h1 className={titleClass}>{vehicleTitle(found.primary)}</h1>
                            <MatchPill tone={BAND_TONE[found.band]}>{found.band} match</MatchPill>
                        </div>
                    </section>
                    <section aria-label="Progress" className={cn(cardClass, "flex flex-col gap-2 @2xl:p-6", resultLeftColumn)}>
                        {slow && <p className="text-[17px] font-semibold text-[#17212B]">{heading}</p>}
                        <p className={bodyClass}>{body}</p>
                        <div className="mt-2 border-t border-[#E4EBF0] pt-4">
                            <StepList steps={steps} />
                        </div>
                    </section>
                </>
            ) : (
                statusCard
            )}
            {slow ? (
                <DifferentPhotoCard tips={copy.tips} href={copy.retryHref} className={resultLeftColumn} />
            ) : (
                <VehicleProductsSkeleton
                    title={found ? `What's on this ${vehicleNoun(found.primary.vehicleType)}` : null}
                    className={resultLeftColumn}
                />
            )}
        </ResultGrid>
    )
}

/** The visitor's photo, full color, with viewfinder corners, a scan line and the checking pill. */
function ScanPhoto({ imageUrl, alt, scanning, checks, found, className }: {
    imageUrl?: string
    alt: string
    scanning: boolean
    checks: readonly string[] | null
    found: boolean
    className?: string
}) {
    const corner = "absolute h-6 w-6 border-white"
    return (
        <div className={cn("relative overflow-hidden rounded-xl", className)}>
            <ResultPhoto fit="contain" imageUrl={imageUrl} alt={alt} className="h-full w-full" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-[14px] [filter:drop-shadow(0_1px_2px_rgba(23,33,43,0.45))]">
                <span className={cn(corner, "left-0 top-0 rounded-tl-md border-l-[3px] border-t-[3px]")} />
                <span className={cn(corner, "right-0 top-0 rounded-tr-md border-r-[3px] border-t-[3px]")} />
                <span className={cn(corner, "bottom-0 left-0 rounded-bl-md border-b-[3px] border-l-[3px]")} />
                <span className={cn(corner, "bottom-0 right-0 rounded-br-md border-b-[3px] border-r-[3px]")} />
            </div>
            {scanning && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[#F26B2D] shadow-[0_0_10px_2px_rgba(242,107,45,0.6)] animate-vf-scan motion-reduce:top-1/2 motion-reduce:animate-none"
                />
            )}
            {checks && <CheckingPill key={checks[0]} lines={checks} />}
            {found && (
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold text-[#17212B] shadow-sm">
                    <span className={cn("flex h-4 w-4 items-center justify-center rounded-full", MATCH_TONE_CLASS.high)}>
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden="true" />
                    </span>
                    Vehicle identified
                </span>
            )}
        </div>
    )
}

/** One line at a time, every 2.8s. Hidden from screen readers so they don't hear it repeat. */
function CheckingPill({ lines }: { lines: readonly string[] }) {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        if (lines.length < 2) return
        const timer = setInterval(() => setIndex(i => (i + 1) % lines.length), 2800)
        return () => clearInterval(timer)
    }, [lines.length])

    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[26px] flex justify-center px-8">
            <span className="flex min-w-0 items-center gap-2 rounded-full bg-[#17212B]/75 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#F26B2D]" />
                <span key={index} className="truncate animate-in fade-in duration-300 motion-reduce:animate-none">
                    {lines[index]}
                </span>
            </span>
        </div>
    )
}

/** The only live region on the screen: a screen reader hears each new step, not the rotating pill. */
function StepList({ steps }: { steps: Step[] }) {
    return (
        <ol aria-live="polite" className="flex flex-col gap-3">
            {steps.map(step => (
                <li key={step.label} aria-current={step.state === "active" ? "step" : undefined} className="flex items-start gap-3">
                    <StepIcon state={step.state} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <span
                            className={cn(
                                "text-[15px]",
                                step.state === "active" && "font-semibold text-[#17212B]",
                                step.state === "done" && "text-[#2B3742]",
                                step.state === "pending" && "text-[#5A6672]"
                            )}
                        >
                            {step.label}
                            {step.state === "done" && <span className="sr-only"> (done)</span>}
                        </span>
                        {step.state === "active" && step.detail && (
                            <span className="text-[13px] leading-snug text-[#5A6672]">{step.detail}</span>
                        )}
                    </div>
                </li>
            ))}
        </ol>
    )
}

function StepIcon({ state }: { state: StepState }) {
    const base = "mt-0.5 h-5 w-5 shrink-0 rounded-full"
    if (state === "done") {
        return (
            <span aria-hidden="true" className={cn(base, "flex items-center justify-center", MATCH_TONE_CLASS.high)}>
                <Check className="h-3 w-3" strokeWidth={3} />
            </span>
        )
    }
    if (state === "active") {
        return (
            <span
                aria-hidden="true"
                className={cn(base, "border-2 border-[#F6CDB8] border-t-[#C8460F] animate-vf-spin motion-reduce:animate-vf-spin-slow")}
            />
        )
    }
    return <span aria-hidden="true" className={cn(base, "border-2 border-[#D5DEE5]")} />
}

/** Sets up the typed part number box on the result. */
function WaitTip({ className }: { className?: string }) {
    return (
        <section aria-label="While you wait" className={cn(cardClass, "flex items-start gap-3 @2xl:items-center", className)}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C8460F]/10 text-[#C8460F]">
                <Hash className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <p className="text-sm leading-snug text-[#2B3742]">
                <strong className="block text-[15px] text-[#17212B] @2xl:mr-1.5 @2xl:inline @2xl:text-sm">While you wait</strong>
                Is there a number stamped or printed on the old part? Jot it down. You can search it on the next screen for an exact match.
            </p>
        </section>
    )
}

/** Shaped like the part result's shop block: title, vehicle chips, the main button, the part number box. */
function PartShopSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col gap-3.5 rounded-2xl border-2 border-[#F6CDB8] bg-white p-4 @2xl:p-5", className)}>
            <p className={placeholderLabelClass}>Your shopping links will appear here</p>
            <div aria-hidden="true" className="flex flex-col gap-3.5">
                <div className={cn(shimmerClass, "h-6 w-3/4")} />
                <div className="flex gap-2">
                    <div className={cn(shimmerClass, "h-9 w-28 rounded-full")} />
                    <div className={cn(shimmerClass, "h-9 w-24 rounded-full")} />
                </div>
                <div className={cn(shimmerClass, "h-[52px] w-full rounded-xl")} />
                <div className="flex flex-col gap-2">
                    <div className={cn(shimmerClass, "h-3.5 w-2/3")} />
                    <div className="flex gap-2">
                        <div className={cn(shimmerClass, "h-11 flex-1 rounded-[10px]")} />
                        <div className={cn(shimmerClass, "h-11 w-20 rounded-[10px]")} />
                    </div>
                </div>
            </div>
        </div>
    )
}

/** Shaped like "What's on this truck": three rows of two text lines and a button. */
function VehicleProductsSkeleton({ title, className }: { title: string | null; className?: string }) {
    return (
        <div className={cn(cardClass, "flex flex-col gap-1.5 @2xl:p-6", className)}>
            {title ? (
                <p className="font-heading text-[19px] font-bold text-[#17212B] @2xl:text-xl">{title}</p>
            ) : (
                <p className={placeholderLabelClass}>Parts we spot on it will appear here</p>
            )}
            <ul aria-hidden="true" className="mt-1 flex flex-col">
                {[0, 1, 2].map(row => (
                    <li key={row} className="flex items-center justify-between gap-2.5 border-t border-[#E4EBF0] py-3">
                        <div className="flex flex-1 flex-col gap-2">
                            <div className={cn(shimmerClass, "h-4 w-1/2")} />
                            <div className={cn(shimmerClass, "h-3 w-1/3")} />
                        </div>
                        <div className={cn(shimmerClass, "h-11 w-20 rounded-[10px]")} />
                    </li>
                ))}
            </ul>
        </div>
    )
}

/** Past 60 seconds. The link doesn't cancel the run: this page keeps polling. */
function DifferentPhotoCard({ tips, href, className }: { tips: readonly string[]; href: string; className?: string }) {
    return (
        <section aria-label="Try a different photo" className={cn(cardClass, "flex flex-col gap-3 @2xl:p-5", className)}>
            <h2 className="font-heading text-[17px] font-bold text-[#17212B]">Want to try a different photo?</h2>
            <ul className="flex flex-col gap-1.5">
                {tips.map(tip => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-[#2B3742]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#116B3C]" strokeWidth={2.5} aria-hidden="true" />
                        {tip}
                    </li>
                ))}
            </ul>
            <Link href={href} className={outlineButtonClass}>
                Try another photo
            </Link>
            <p className="text-xs text-[#5A6672]">This page keeps working if you stay.</p>
        </section>
    )
}
