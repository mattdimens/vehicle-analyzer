"use client"

import { useId, useRef, useState } from "react"
import { AlertTriangle, Camera, ChevronDown, ExternalLink, SquareCheckBig } from "lucide-react"
import type { PartIdentification } from "@/app/actions"
import { SaveToPartsButton } from "@/components/save-to-parts-button"
import { PartVehiclePicker } from "@/components/home/part-vehicle-picker"
import {
    AFFILIATE_LINK_PROPS,
    AiDisclaimer,
    cardClass,
    CommissionNote,
    fieldLabelClass,
    MatchPill as ShellMatchPill,
    outlineButtonClass,
    primaryButtonClass,
    ResultGrid,
    ResultHeaderCard,
    resultLeftColumn,
    ResultPhoto,
    resultSidePanel,
    sectionTitleClass,
    stickyActionClass,
    StickyResultBar,
    type MatchTone,
} from "@/components/results/result-shell"
import { getPartDisplayBand, type PartDisplayBand } from "@/config/analysis"
import {
    buildExactPartSearch,
    buildPartGoUrl,
    buildPartSearch,
    buildTypedPartSearch,
    buildVehicleItemSearch,
    partSearchVehicle,
    sanitizeTypedPartNumber,
    TYPED_PART_NUMBER_MAX_LENGTH,
    TYPED_PART_NUMBER_MIN_LENGTH,
} from "@/lib/part-search"
import {
    detectedVehicleLabel,
    initialPartVehicle,
    partForVehicle,
    readPartVehicleChoice,
    savePartVehicleChoice,
    type PartVehicleChoice,
} from "@/lib/part-vehicle"
import { getEntryDoor, trackEvent } from "@/lib/analytics"
import { cn } from "@/lib/utils"

interface PartResultProps {
    part: PartIdentification
    imageUrl?: string
    hideSaveActions?: boolean
    /** Opens the photo picker for another part photo. Omitted where there is no upload flow (My Garage). */
    onRequestPhoto?: () => void
    /** Show the mobile sticky shop bar for this result. Only one result on a page gets it. */
    showStickyBar?: boolean
    /** h1 on /r/[id], which has no other heading; h3 under a page's own H1. */
    titleAs?: "h1" | "h3"
}

/** Match pill per layout band. The part sample card uses it too. */
export const PART_BAND_PILL: Record<PartDisplayBand, { label: string; tone: MatchTone }> = {
    strong: { label: "High match", tone: "high" },
    medium: { label: "Medium match", tone: "medium" },
    low: { label: "Low match", tone: "low" },
}

const RETAKE_TIPS = [
    "Fill the frame with the part, on a plain surface.",
    "Include any stamped numbers, logos or labels.",
    "Use daylight or a flashlight, no filters.",
]

/** Part identifier result: answer first, then the shop block, then details. */
export function PartResult({ part, imageUrl, hideSaveActions, onRequestPhoto, showStickyBar, titleAs = "h3" }: PartResultProps) {
    const band = getPartDisplayBand(part.confidence)
    const isLow = band === "low"
    // Strong and medium: the visitor confirms the vehicle (chips in the shop
    // block). A garage or Year/Make/Model choice carries over this session.
    const detectedVehicle = detectedVehicleLabel(part)
    const [chosenVehicle, setChosenVehicle] = useState<PartVehicleChoice | null>(() =>
        initialPartVehicle(readPartVehicleChoice(), detectedVehicle)
    )
    const handleVehicleSelect = (choice: PartVehicleChoice) => {
        setChosenVehicle(choice)
        savePartVehicleChoice(choice)
        trackEvent("part_vehicle_selected", { method: choice.method, entry_door: getEntryDoor() })
    }
    // The low band has no chips, so its searches keep the part's own vehicle
    const searchPart = isLow ? part : partForVehicle(part, chosenVehicle)

    // The vehicle the searches are for, and the (often longer) vehicle the details row shows
    const vehicle = isLow ? partSearchVehicle(part) : chosenVehicle?.label ?? null
    const foundOn = part.estimatedVehicle?.trim() || null
    const vehicleQuery = buildPartSearch(searchPart)
    const vehicleHref = buildPartGoUrl(part.category, vehicleQuery, isLow ? "part-vehicle-low" : "part-vehicle")
    // Exact part: strong band only, and only when a number was legible in the photo
    const partNumber = band === "strong" ? part.partNumber?.trim() || null : null
    const primaryQuery = partNumber ? buildExactPartSearch(partNumber, part.partName) : vehicleQuery
    const primaryRef = useRef<HTMLAnchorElement>(null)
    const showCloserMatch = band === "medium" && Boolean(onRequestPhoto)

    // Model extras. Saved parts from before these existed don't have them.
    const buyingCheck = !isLow ? part.buyingCheck?.trim() || null : null
    const relatedParts = !isLow && Array.isArray(part.relatedParts)
        ? part.relatedParts.filter((item): item is string => typeof item === "string" && item.trim() !== "")
        : []
    const alternatives = band === "medium" && Array.isArray(part.alternatives)
        ? part.alternatives.filter(alt => typeof alt?.partName === "string" && typeof alt.confidence === "number")
        : []

    const leftColumn = resultLeftColumn

    return (
        <ResultGrid
            after={showStickyBar && (
                <StickyResultBar
                    imageUrl={imageUrl}
                    imageAlt="Your part photo"
                    title={part.partName}
                    subtitle={vehicle ? `For ${vehicle}` : null}
                    watchRef={primaryRef}
                    action={
                        <a
                            href={buildPartGoUrl(part.category, primaryQuery, isLow ? "part-sticky-low" : "part-sticky")}
                            {...AFFILIATE_LINK_PROPS}
                            className={stickyActionClass}
                        >
                            Shop on Amazon
                        </a>
                    }
                />
            )}
        >
            {isLow ? (
                <LowMatchHeader part={part} imageUrl={imageUrl} onRequestPhoto={onRequestPhoto} titleAs={titleAs} className={leftColumn} />
            ) : (
                <ResultHeader part={part} band={band} imageUrl={imageUrl} titleAs={titleAs} className={leftColumn} />
            )}

            {showCloserMatch && (
                <section aria-label="Get a closer match" className={cn(cardClass, "flex flex-col gap-2.5", leftColumn)}>
                    <p className="font-heading text-[17px] font-bold text-[#17212B]">Get a closer match first</p>
                    <p className="text-sm leading-normal text-[#2B3742]">
                        A second photo of the connector or any printed number usually settles it.
                    </p>
                    <button
                        type="button"
                        onClick={onRequestPhoto}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#17212B] px-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#2B3742]"
                    >
                        <Camera className="h-[18px] w-[18px]" aria-hidden="true" />
                        Add another photo of this part
                    </button>
                </section>
            )}

            <section
                aria-label={isLow ? "Shop our best guess" : "Shop this part"}
                className={cn(
                    "@container/shop flex flex-col gap-3.5 rounded-2xl bg-white p-4 @2xl:p-5",
                    isLow ? "border-[1.5px] border-[#E7A6A6]" : "border-2 border-[#C8460F]",
                    resultSidePanel
                )}
            >
                {isLow ? (
                    <>
                        <div className="flex items-start gap-2.5 rounded-[10px] bg-[#FFF4F4] px-3 py-2.5">
                            <AlertTriangle className="mt-px h-[18px] w-[18px] shrink-0 text-[#9B1C1C]" aria-hidden="true" />
                            <p className="text-[13px] leading-snug text-[#7F1D1D]">
                                <strong>Low match.</strong> This is a guess. Compare listings against your part before you buy.
                            </p>
                        </div>
                        <a ref={primaryRef} href={vehicleHref} {...AFFILIATE_LINK_PROPS} className={outlineButtonClass}>
                            Browse {part.partName} on Amazon
                            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </a>
                        <TypedPartNumberBox
                            part={part}
                            source="part-typed-low"
                            label="Or search a number stamped on the part"
                            placeholder="Part number"
                        />
                    </>
                ) : (
                    <>
                        <p className={cn(sectionTitleClass, "@2xl/result:text-xl")}>
                            {showCloserMatch ? "Or compare and shop now" : "Get the right replacement"}
                        </p>
                        <PartVehiclePicker detected={detectedVehicle} selected={chosenVehicle} onSelect={handleVehicleSelect} />
                        {partNumber ? (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[10px] bg-[#F4F7F9] px-3 py-2.5">
                                    <span className="text-[13px] text-[#5A6672]">Part number on your photo</span>
                                    <span className="break-all font-mono text-[15px] font-semibold tracking-wide text-[#17212B]">{partNumber}</span>
                                </div>
                                <a
                                    ref={primaryRef}
                                    href={buildPartGoUrl(part.category, primaryQuery, "part-exact")}
                                    {...AFFILIATE_LINK_PROPS}
                                    className={primaryButtonClass}
                                >
                                    Shop this exact part on Amazon
                                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                                </a>
                                <a href={vehicleHref} {...AFFILIATE_LINK_PROPS} className={outlineButtonClass}>
                                    {vehicle ? `Shop ${part.partName} for ${vehicle}` : `Shop ${part.partName} on Amazon`}
                                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                                </a>
                            </>
                        ) : (
                            <>
                                <a ref={primaryRef} href={vehicleHref} {...AFFILIATE_LINK_PROPS} className={primaryButtonClass}>
                                    <span className="flex min-w-0 flex-col items-center">
                                        <span>Shop {part.partName} on Amazon</span>
                                        {vehicle && (
                                            <span className="line-clamp-1 text-xs font-medium text-white/90">For {vehicle}</span>
                                        )}
                                    </span>
                                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                                </a>
                                {/* The number is already known in the exact-part state, so the box only shows here */}
                                <TypedPartNumberBox
                                    part={part}
                                    source="part-typed"
                                    label="Have the old part? Search the number stamped on it"
                                    placeholder="e.g. 06H906036P"
                                />
                            </>
                        )}

                        {alternatives.length > 0 && (
                            <ShopList
                                title="It could also be"
                                items={alternatives.map(alt => ({
                                    label: alt.partName,
                                    detail: `${alt.confidence}% match`,
                                    href: buildPartGoUrl(part.category, buildVehicleItemSearch(searchPart, alt.partName), "part-alt"),
                                }))}
                            />
                        )}

                        {buyingCheck && (
                            <div className="flex gap-2.5 rounded-[10px] bg-[#FFF8E6] p-3">
                                <SquareCheckBig className="mt-px h-[18px] w-[18px] shrink-0 text-[#7A4B00]" aria-hidden="true" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[13px] font-semibold text-[#7A4B00]">Before you buy</span>
                                    <span className="text-[13px] leading-snug text-[#5C3A00]">{buyingCheck}</span>
                                </div>
                            </div>
                        )}

                        {relatedParts.length > 0 && (
                            <ShopList
                                title="Often replaced at the same time"
                                items={relatedParts.map(item => ({
                                    label: item,
                                    href: buildPartGoUrl(part.category, buildVehicleItemSearch(searchPart, item), "part-related"),
                                }))}
                            />
                        )}
                    </>
                )}
                <CommissionNote />
            </section>

            <PartDetails part={part} vehicle={foundOn} className={leftColumn} />

            {!hideSaveActions && (
                <div className={leftColumn}>
                    <SaveToPartsButton
                        partImageUrl={imageUrl as string}
                        partIdentification={part}
                        variant="outline"
                        className="mt-0 sm:mt-0 h-12 w-full sm:w-full rounded-xl border-[1.5px] border-[#D5DEE5] bg-white text-[15px] font-semibold text-[#17212B] shadow-none hover:bg-[#F4F7F9] hover:text-[#17212B] @2xl:h-11 @2xl:w-auto @2xl:px-4 @2xl:text-sm"
                    />
                </div>
            )}

            <AiDisclaimer className={leftColumn} />
        </ResultGrid>
    )
}

/** A short list of extra searches, each a row with a "Shop" link. */
function ShopList({ title, items }: { title: string; items: { label: string; detail?: string; href: string }[] }) {
    return (
        <div className="flex flex-col gap-2">
            <p className={fieldLabelClass}>{title}</p>
            <ul className="flex flex-col gap-1.5">
                {items.map(item => (
                    <li key={item.label}>
                        <a
                            href={item.href}
                            {...AFFILIATE_LINK_PROPS}
                            className="flex min-h-11 items-center justify-between gap-3 rounded-[10px] border border-[#D5DEE5] px-3 py-1.5 text-[#17212B] transition-colors hover:bg-[#F4F7F9]"
                        >
                            <span className="flex min-w-0 flex-col">
                                <span className="text-sm font-medium">{item.label}</span>
                                {item.detail && <span className="text-xs text-[#5A6672]">{item.detail}</span>}
                            </span>
                            <span className="shrink-0 text-[13px] font-semibold text-[#9A3412]">Shop</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function MatchPill({ band, confidence }: { band: PartDisplayBand; confidence: number }) {
    const pill = PART_BAND_PILL[band]
    return (
        <ShellMatchPill tone={pill.tone}>
            {pill.label} · {confidence}%
        </ShellMatchPill>
    )
}

function ResultHeader({ part, band, imageUrl, titleAs, className }: { part: PartIdentification; band: PartDisplayBand; imageUrl?: string; titleAs: "h1" | "h3"; className?: string }) {
    return (
        <ResultHeaderCard
            ariaLabel="Identified part"
            imageUrl={imageUrl}
            imageAlt="Your part photo"
            eyebrow={<>{part.category}{band === "medium" && " · Most likely"}</>}
            title={part.partName}
            titleAs={titleAs}
            pill={<MatchPill band={band} confidence={part.confidence} />}
            summary={part.function}
            className={className}
        />
    )
}

function LowMatchHeader({ part, imageUrl, onRequestPhoto, titleAs: Title, className }: { part: PartIdentification; imageUrl?: string; onRequestPhoto?: () => void; titleAs: "h1" | "h3"; className?: string }) {
    return (
        <section aria-label="No confident match" className={cn(cardClass, "flex flex-col gap-3.5 py-5 @2xl:p-6", className)}>
            <div className="flex items-center gap-3">
                <ResultPhoto fit="contain" imageUrl={imageUrl} alt="Your part photo" className="h-16 w-16 @2xl:h-24 @2xl:w-24" />
                <div className="flex min-w-0 flex-col gap-1">
                    <Title className="font-heading text-[22px] font-bold leading-tight text-[#17212B]">We couldn&apos;t pin this one down</Title>
                    <MatchPill band="low" confidence={part.confidence} />
                </div>
            </div>
            <p className="text-[15px] leading-normal text-[#2B3742]">
                Our best guess is a <strong>{part.partName}</strong>, but the photo doesn&apos;t show enough detail to be sure.
            </p>
            <ul className="flex flex-col gap-2.5">
                {RETAKE_TIPS.map((tip, index) => (
                    <li key={tip} className="flex gap-2.5 text-sm leading-snug text-[#17212B]">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E4EBF0] text-xs font-semibold" aria-hidden="true">
                            {index + 1}
                        </span>
                        {tip}
                    </li>
                ))}
            </ul>
            {onRequestPhoto && (
                <button type="button" onClick={onRequestPhoto} className={cn(primaryButtonClass, "@2xl:w-auto @2xl:self-start @2xl:px-6")}>
                    <Camera className="h-[18px] w-[18px]" aria-hidden="true" />
                    Try another photo
                </button>
            )}
        </section>
    )
}

/** Mobile: accordion rows. Desktop (wide container): both shown expanded. */
function PartDetails({ part, vehicle, className }: { part: PartIdentification; vehicle: string | null; className?: string }) {
    const rows = [
        { key: "reasoning", title: "How we identified it", body: part.reasoning },
        ...(vehicle ? [{ key: "vehicle", title: "Vehicles it's found on", body: vehicle }] : []),
    ]
    const [open, setOpen] = useState<Set<string>>(new Set())
    const baseId = useId()

    const toggle = (key: string) =>
        setOpen(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })

    return (
        <section
            aria-label="Details"
            className={cn(
                "overflow-hidden rounded-2xl border border-[#D5DEE5] bg-white",
                "@2xl:grid @2xl:gap-5 @2xl:p-6",
                rows.length > 1 && "@2xl:grid-cols-2",
                className
            )}
        >
            {rows.map((row, index) => {
                const isOpen = open.has(row.key)
                const panelId = `${baseId}-${row.key}`
                return (
                    <div key={row.key} className={cn(index > 0 && "border-t border-[#E4EBF0] @2xl:border-t-0")}>
                        <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            onClick={() => toggle(row.key)}
                            className="flex min-h-[52px] w-full items-center justify-between px-4 text-left text-[15px] font-semibold text-[#17212B] @2xl:hidden"
                        >
                            {row.title}
                            <ChevronDown className={cn("h-[18px] w-[18px] shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                        </button>
                        <p className="hidden text-xs font-semibold uppercase tracking-[0.06em] text-[#5A6672] @2xl:mb-1.5 @2xl:block">{row.title}</p>
                        <p
                            id={panelId}
                            className={cn(
                                "px-4 pb-4 text-sm leading-relaxed text-[#2B3742] @2xl:block @2xl:p-0 @2xl:text-[15px]",
                                !isOpen && "hidden"
                            )}
                        >
                            {row.body}
                        </p>
                    </div>
                )
            })}
        </section>
    )
}

/**
 * Search box for a number stamped on the visitor's old part. "Search" is a
 * real /go link whose href follows the input, so the global click tracker
 * fires affiliate_click; Enter clicks the same link.
 */
function TypedPartNumberBox({ part, source, label, placeholder }: { part: PartIdentification; source: string; label: string; placeholder: string }) {
    const [typed, setTyped] = useState("")
    const linkRef = useRef<HTMLAnchorElement>(null)
    const inputId = useId()
    const enabled = typed.trim().length >= TYPED_PART_NUMBER_MIN_LENGTH
    const href = enabled ? buildPartGoUrl(part.category, buildTypedPartSearch(typed, part.partName), source) : undefined

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className={fieldLabelClass}>{label}</label>
            <div className="flex gap-2">
                <input
                    id={inputId}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={TYPED_PART_NUMBER_MAX_LENGTH}
                    placeholder={placeholder}
                    value={typed}
                    onChange={e => setTyped(sanitizeTypedPartNumber(e.target.value))}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            if (enabled) linkRef.current?.click()
                        }
                    }}
                    className="min-h-11 min-w-0 flex-1 rounded-[10px] border border-[#B9C5CF] bg-white px-3 text-[15px] text-[#17212B] placeholder:text-[#6B7783] focus:border-[#17212B] focus:outline-none focus:ring-2 focus:ring-[#17212B]/15"
                />
                <a
                    ref={linkRef}
                    href={href}
                    {...AFFILIATE_LINK_PROPS}
                    aria-disabled={!enabled}
                    onClick={e => {
                        if (!enabled) e.preventDefault()
                    }}
                    className={cn(
                        "flex min-h-11 items-center rounded-[10px] border-[1.5px] px-3.5 text-sm font-semibold transition-colors",
                        enabled
                            ? "border-[#17212B] bg-white text-[#17212B] hover:bg-[#F4F7F9]"
                            : "cursor-not-allowed border-[#D5DEE5] bg-[#F4F7F9] text-[#8A96A1]"
                    )}
                >
                    Search
                </a>
            </div>
        </div>
    )
}
