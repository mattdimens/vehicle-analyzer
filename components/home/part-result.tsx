"use client"

import { useEffect, useId, useRef, useState, type RefObject } from "react"
import { AlertTriangle, Camera, ChevronDown, ExternalLink } from "lucide-react"
import type { PartIdentification } from "@/app/actions"
import { SaveToPartsButton } from "@/components/save-to-parts-button"
import { AFFILIATE_DISCLOSURE_HREF, AI_DISCLAIMER_TEXT, COMMISSION_NOTE_TEXT } from "@/components/home/result-notices"
import { getPartDisplayBand, type PartDisplayBand } from "@/config/analysis"
import {
    buildPartGoUrl,
    buildPartSearch,
    buildTypedPartSearch,
    sanitizeTypedPartNumber,
    TYPED_PART_NUMBER_MAX_LENGTH,
    TYPED_PART_NUMBER_MIN_LENGTH,
} from "@/lib/part-search"
import { cn } from "@/lib/utils"

interface PartResultProps {
    part: PartIdentification
    imageUrl?: string
    hideSaveActions?: boolean
    /** Opens the photo picker for another part photo. Omitted where there is no upload flow (My Garage). */
    onRequestPhoto?: () => void
    /** Show the mobile sticky shop bar for this result. Only one result on a page gets it. */
    showStickyBar?: boolean
}

const AFFILIATE_LINK_PROPS = { target: "_blank", rel: "nofollow sponsored noopener" } as const

const BAND_PILL: Record<PartDisplayBand, { label: string; className: string }> = {
    strong: { label: "High match", className: "bg-[#E3F6EC] text-[#116B3C]" },
    medium: { label: "Medium match", className: "bg-[#FFF1D6] text-[#7A4B00]" },
    low: { label: "Low match", className: "bg-[#FDE8E8] text-[#9B1C1C]" },
}

const RETAKE_TIPS = [
    "Fill the frame with the part, on a plain surface.",
    "Include any stamped numbers, logos or labels.",
    "Use daylight or a flashlight, no filters.",
]

const cardClass = "rounded-2xl border border-[#D5DEE5] bg-white p-4"
const sectionTitleClass = "font-heading text-lg font-bold text-[#17212B]"
const fieldLabelClass = "text-[13px] font-semibold text-[#5A6672]"
const primaryButtonClass =
    "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#C8460F] px-3 py-2 text-center text-base font-semibold text-white transition-colors hover:bg-[#AD3C0C]"
const outlineButtonClass =
    "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#17212B] bg-white px-3 py-2 text-center text-[15px] font-semibold text-[#17212B] transition-colors hover:bg-[#F4F7F9]"

/** Part identifier result: answer first, then the shop block, then details. */
export function PartResult({ part, imageUrl, hideSaveActions, onRequestPhoto, showStickyBar }: PartResultProps) {
    const band = getPartDisplayBand(part.confidence)
    const isLow = band === "low"
    const vehicle = part.estimatedVehicle?.trim() || null
    const query = buildPartSearch(part)
    const primaryHref = buildPartGoUrl(part.category, query, isLow ? "part-vehicle-low" : "part-vehicle")
    const primaryRef = useRef<HTMLAnchorElement>(null)
    const showCloserMatch = band === "medium" && Boolean(onRequestPhoto)

    // Desktop: two columns. The shop panel spans every row of the right
    // column so it can stay sticky; the trailing 1fr row absorbs its extra height.
    const leftColumn = "@2xl:col-start-1"

    return (
        <div className="@container">
            <div className="grid gap-3 @2xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] @2xl:grid-rows-[auto_auto_auto_auto_auto_1fr] @2xl:gap-x-5 @2xl:gap-y-4">
                {isLow ? (
                    <LowMatchHeader part={part} imageUrl={imageUrl} onRequestPhoto={onRequestPhoto} className={leftColumn} />
                ) : (
                    <ResultHeader part={part} band={band} imageUrl={imageUrl} className={leftColumn} />
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
                        "flex flex-col gap-3.5 rounded-2xl bg-white p-4 @2xl:p-5",
                        isLow ? "border-[1.5px] border-[#E7A6A6]" : "border-2 border-[#C8460F]",
                        "@2xl:sticky @2xl:top-20 @2xl:col-start-2 @2xl:row-span-6 @2xl:row-start-1 @2xl:self-start"
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
                            <a ref={primaryRef} href={primaryHref} {...AFFILIATE_LINK_PROPS} className={outlineButtonClass}>
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
                            <p className={cn(sectionTitleClass, "@2xl:text-xl")}>
                                {showCloserMatch ? "Or compare and shop now" : "Get the right replacement"}
                            </p>
                            <a ref={primaryRef} href={primaryHref} {...AFFILIATE_LINK_PROPS} className={primaryButtonClass}>
                                <span className="flex min-w-0 flex-col items-center">
                                    <span>Shop {part.partName} on Amazon</span>
                                    {vehicle && (
                                        <span className="line-clamp-1 text-xs font-medium text-white/90">For {vehicle}</span>
                                    )}
                                </span>
                                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                            </a>
                            <TypedPartNumberBox
                                part={part}
                                source="part-typed"
                                label="Have the old part? Search the number stamped on it"
                                placeholder="e.g. 06H906036P"
                            />
                        </>
                    )}
                    <p className="text-xs leading-snug text-[#5A6672]">
                        {COMMISSION_NOTE_TEXT}{" "}
                        <a href={AFFILIATE_DISCLOSURE_HREF} className="text-[#9A3412] underline underline-offset-2 hover:text-[#7C2D12]">
                            Learn more
                        </a>
                    </p>
                </section>

                <PartDetails part={part} vehicle={vehicle} className={leftColumn} />

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

                <p className={cn("text-xs leading-normal text-[#5A6672]", leftColumn)}>
                    <strong className="text-[#7A4B00]">Disclaimer:</strong> {AI_DISCLAIMER_TEXT}
                </p>
            </div>

            {showStickyBar && (
                <StickyShopBar
                    part={part}
                    vehicle={vehicle}
                    imageUrl={imageUrl}
                    href={buildPartGoUrl(part.category, query, isLow ? "part-sticky-low" : "part-sticky")}
                    watchRef={primaryRef}
                />
            )}
        </div>
    )
}

function PartThumbnail({ imageUrl, className }: { imageUrl?: string; className?: string }) {
    return (
        <div className={cn("shrink-0 overflow-hidden rounded-xl border border-[#D5DEE5] bg-[#E4EBF0]", className)}>
            {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- user photo (Supabase URL); skip Vercel image optimization quota
                <img src={imageUrl} alt="Your part photo" className="h-full w-full object-cover" />
            )}
        </div>
    )
}

function MatchPill({ band, confidence }: { band: PartDisplayBand; confidence: number }) {
    const pill = BAND_PILL[band]
    return (
        <span className={cn("self-start rounded-full px-2.5 py-1 text-[13px] font-semibold", pill.className)}>
            {pill.label} · {confidence}%
        </span>
    )
}

function ResultHeader({ part, band, imageUrl, className }: { part: PartIdentification; band: PartDisplayBand; imageUrl?: string; className?: string }) {
    return (
        <section
            aria-label="Identified part"
            className={cn(
                cardClass,
                "grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3 @2xl:grid-cols-[160px_minmax(0,1fr)] @2xl:gap-x-5 @2xl:gap-y-3 @2xl:p-6",
                className
            )}
        >
            <PartThumbnail imageUrl={imageUrl} className="h-[72px] w-[72px] @2xl:row-span-2 @2xl:h-40 @2xl:w-40" />
            <div className="flex min-w-0 flex-col gap-1 @2xl:gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9A3412]">
                    {part.category}
                    {band === "medium" && " · Most likely"}
                </span>
                <h3 className="font-heading text-[26px] font-bold leading-[1.1] text-[#17212B] @2xl:text-[34px]">{part.partName}</h3>
                <MatchPill band={band} confidence={part.confidence} />
            </div>
            <p className="col-span-2 text-[15px] leading-snug text-[#2B3742] @2xl:col-span-1 @2xl:col-start-2 @2xl:text-base @2xl:leading-normal">
                {part.function}
            </p>
        </section>
    )
}

function LowMatchHeader({ part, imageUrl, onRequestPhoto, className }: { part: PartIdentification; imageUrl?: string; onRequestPhoto?: () => void; className?: string }) {
    return (
        <section aria-label="No confident match" className={cn(cardClass, "flex flex-col gap-3.5 py-5 @2xl:p-6", className)}>
            <div className="flex items-center gap-3">
                <PartThumbnail imageUrl={imageUrl} className="h-16 w-16 @2xl:h-24 @2xl:w-24" />
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="font-heading text-[22px] font-bold leading-tight text-[#17212B]">We couldn&apos;t pin this one down</h3>
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

/**
 * Mobile-only bar that keeps the shop link on screen once the main shop
 * button has scrolled up out of view.
 */
function StickyShopBar({ part, vehicle, imageUrl, href, watchRef }: {
    part: PartIdentification
    vehicle: string | null
    imageUrl?: string
    href: string
    watchRef: RefObject<HTMLAnchorElement | null>
}) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const target = watchRef.current
        if (!target || typeof IntersectionObserver === "undefined") return
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Only once it has gone up past the (fixed, 56px) site header;
                // not while the visitor is still above it.
                setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 56)
            },
            { rootMargin: "-56px 0px 0px 0px" }
        )
        observer.observe(target)
        return () => observer.disconnect()
    }, [watchRef])

    if (!visible) return null

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-[#D5DEE5] bg-white px-4 pt-2.5 shadow-[0_-6px_18px_rgba(23,33,43,0.10)] md:hidden"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
            <PartThumbnail imageUrl={imageUrl} className="h-11 w-11 rounded-[10px]" />
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold text-[#17212B]">{part.partName}</span>
                {vehicle && <span className="truncate text-xs text-[#5A6672]">For {vehicle}</span>}
            </div>
            <a
                href={href}
                {...AFFILIATE_LINK_PROPS}
                className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl bg-[#C8460F] px-4 text-[15px] font-semibold text-white"
            >
                Shop on Amazon
            </a>
        </div>
    )
}

