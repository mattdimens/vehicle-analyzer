"use client"

import { useEffect, useState, type ReactNode, type RefObject } from "react"
import Image from "next/image"
import { AFFILIATE_DISCLOSURE_HREF, AI_DISCLAIMER_TEXT, COMMISSION_NOTE_TEXT } from "@/components/home/result-notices"
import { cn } from "@/lib/utils"

/**
 * Layout pieces shared by the part and vehicle results: the header card,
 * the two-column grid with a sticky shop panel, the mobile sticky bar and
 * the notices. Breakpoints are container queries on the result grid
 * (`@2xl` = 672px of result width), so a result looks the same wherever
 * it is mounted.
 */

// Class tokens live in ./tokens so server components can use them too (a
// "use client" module hands server components references, not strings).
import {
    AFFILIATE_LINK_PROPS,
    cardClass,
    eyebrowClass,
    sectionTitleClass,
    fieldLabelClass,
    primaryButtonClass,
    outlineButtonClass,
} from "./tokens"

export {
    AFFILIATE_LINK_PROPS,
    cardClass,
    eyebrowClass,
    sectionTitleClass,
    fieldLabelClass,
    primaryButtonClass,
    outlineButtonClass,
}

/** Desktop placement for everything in the left column. */
export const resultLeftColumn = "@2xl:col-start-1"
/** Desktop placement for the sticky shop panel: it spans every row of the right column. */
export const resultSidePanel = "@2xl:sticky @2xl:top-20 @2xl:col-start-2 @2xl:row-span-6 @2xl:row-start-1 @2xl:self-start"

/**
 * Two columns on wide results. The side panel spans every row of the right
 * column so it can stay sticky; the trailing 1fr row absorbs its extra height.
 */
export function ResultGrid({ children, after }: { children: ReactNode; after?: ReactNode }) {
    return (
        <div className="@container/result">
            <div className="grid gap-3 @2xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] @2xl:grid-rows-[auto_auto_auto_auto_auto_1fr] @2xl:gap-x-5 @2xl:gap-y-4">
                {children}
            </div>
            {after}
        </div>
    )
}

export type MatchTone = "high" | "medium" | "low"

export const MATCH_TONE_CLASS: Record<MatchTone, string> = {
    high: "bg-[#E3F6EC] text-[#116B3C]",
    medium: "bg-[#FFF1D6] text-[#7A4B00]",
    low: "bg-[#FDE8E8] text-[#9B1C1C]",
}

export function MatchPill({ tone, size = "md", children }: { tone: MatchTone; size?: "md" | "sm"; children: ReactNode }) {
    return (
        <span
            className={cn(
                "self-start rounded-full",
                size === "md" ? "px-2.5 py-1 text-[13px]" : "px-2 py-0.5 text-[11px]",
                "font-semibold",
                MATCH_TONE_CLASS[tone]
            )}
        >
            {children}
        </span>
    )
}

/**
 * The analysed photo. Visitors' photos load as-is (no image optimization
 * quota spent on them); pass `sizes` for our own static images (the samples)
 * to get resized, lazily loaded copies.
 *
 * `fit="contain"` shows the whole photo, whatever its shape, over a soft
 * blurred copy of itself so the frame doesn't show empty bars. Use it
 * wherever the visitor looks at their photo. `fit="cover"` (the default)
 * fills the frame and trims the edges, for tiny thumbnails and the samples.
 */
export function ResultPhoto({ imageUrl, alt, sizes, className, fit = "cover" }: {
    imageUrl?: string
    alt: string
    sizes?: string
    className?: string
    fit?: "cover" | "contain"
}) {
    const contain = fit === "contain"
    const frameClass = cn(
        "relative shrink-0 overflow-hidden rounded-xl border border-[#D5DEE5]",
        contain ? "bg-white" : "bg-[#E4EBF0]",
        className
    )

    if (sizes && imageUrl) {
        return (
            <div className={frameClass}>
                {contain && (
                    <Image src={imageUrl} alt="" aria-hidden="true" fill sizes={sizes} className="scale-110 object-cover opacity-30 blur-xl" />
                )}
                <Image src={imageUrl} alt={alt} fill sizes={sizes} className={contain ? "object-contain" : "object-cover"} />
            </div>
        )
    }
    return (
        <div className={frameClass}>
            {imageUrl && contain && (
                // eslint-disable-next-line @next/next/no-img-element -- decorative backdrop of the same user photo (cached, one request)
                <img src={imageUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-xl" />
            )}
            {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- user photo (Supabase URL); skip Vercel image optimization quota
                <img src={imageUrl} alt={alt} className={cn("relative h-full w-full", contain ? "object-contain" : "object-cover")} />
            )}
        </div>
    )
}

interface ResultHeaderCardProps {
    ariaLabel: string
    imageUrl?: string
    imageAlt: string
    eyebrow: ReactNode
    title: ReactNode
    /** The part result sits under the part identifier's own H1; the /r/ page has none. */
    titleAs?: "h1" | "h3"
    pill: ReactNode
    summary?: ReactNode
    /**
     * "thumb": a square thumbnail beside the title (parts).
     * "banner": a full-width photo on narrow cards, beside the text on wide ones (vehicles).
     */
    photo?: "thumb" | "banner"
    /** Extra rows under the summary (banner layout only). */
    children?: ReactNode
    className?: string
}

/** The answer card: photo, category label, title, match pill and a one-line summary. */
export function ResultHeaderCard({
    ariaLabel,
    imageUrl,
    imageAlt,
    eyebrow,
    title,
    titleAs: Title = "h3",
    pill,
    summary,
    photo = "thumb",
    children,
    className,
}: ResultHeaderCardProps) {
    if (photo === "banner") {
        return (
            <section aria-label={ariaLabel} className={cn("@container/header overflow-hidden rounded-2xl border border-[#D5DEE5] bg-white", className)}>
                <div className="flex flex-col @xl/header:flex-row @xl/header:items-start @xl/header:gap-6 @xl/header:p-6">
                    <ResultPhoto
                        imageUrl={imageUrl}
                        alt={imageAlt}
                        fit="contain"
                        className="h-[190px] w-full rounded-none border-0 @xl/header:h-[180px] @xl/header:w-[260px] @xl/header:rounded-[14px]"
                    />
                    <div className="@container/header-body flex min-w-0 flex-1 flex-col gap-2.5 p-4 @xl/header:p-0">
                        <span className={eyebrowClass}>{eyebrow}</span>
                        <Title className="font-heading text-[26px] font-bold leading-[1.15] text-[#17212B] @xl/header:text-[32px] @xl/header:leading-[1.1]">
                            {title}
                        </Title>
                        {pill}
                        {summary && <p className="text-sm text-[#2B3742] @xl/header:text-[15px]">{summary}</p>}
                        {children}
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section
            aria-label={ariaLabel}
            className={cn(
                cardClass,
                "grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3 @2xl:grid-cols-[160px_minmax(0,1fr)] @2xl:gap-x-5 @2xl:gap-y-3 @2xl:p-6",
                className
            )}
        >
            <ResultPhoto imageUrl={imageUrl} alt={imageAlt} fit="contain" className="h-[72px] w-[72px] @2xl:row-span-2 @2xl:h-40 @2xl:w-40" />
            <div className="flex min-w-0 flex-col gap-1 @2xl:gap-2">
                <span className={eyebrowClass}>{eyebrow}</span>
                <Title className="font-heading text-[26px] font-bold leading-[1.1] text-[#17212B] @2xl:text-[34px]">{title}</Title>
                {pill}
            </div>
            <p className="col-span-2 text-[15px] leading-snug text-[#2B3742] @2xl:col-span-1 @2xl:col-start-2 @2xl:text-base @2xl:leading-normal">
                {summary}
            </p>
        </section>
    )
}

/** Commission note: stays next to the shop links. */
export function CommissionNote({ className }: { className?: string }) {
    return (
        <p className={cn("text-xs leading-snug text-[#5A6672]", className)}>
            {COMMISSION_NOTE_TEXT}{" "}
            <a href={AFFILIATE_DISCLOSURE_HREF} className="text-[#9A3412] underline underline-offset-2 hover:text-[#7C2D12]">
                Learn more
            </a>
        </p>
    )
}

/** The AI disclaimer, small, at the bottom of a result. */
export function AiDisclaimer({ className }: { className?: string }) {
    return (
        <p className={cn("text-xs leading-normal text-[#5A6672]", className)}>
            <strong className="text-[#7A4B00]">Disclaimer:</strong> {AI_DISCLAIMER_TEXT}
        </p>
    )
}

/**
 * Mobile-only bar that keeps a shop action on screen once the watched
 * element has scrolled up out of view.
 */
export function StickyResultBar({ imageUrl, imageAlt, title, subtitle, action, watchRef }: {
    imageUrl?: string
    imageAlt: string
    title: string
    subtitle?: string | null
    action: ReactNode
    watchRef: RefObject<HTMLElement | null>
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
            <ResultPhoto imageUrl={imageUrl} alt={imageAlt} className="h-11 w-11 rounded-[10px]" />
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold text-[#17212B]">{title}</span>
                {subtitle && <span className="truncate text-xs text-[#5A6672]">{subtitle}</span>}
            </div>
            {action}
        </div>
    )
}

/** Class for the sticky bar's action button or link. */
export const stickyActionClass =
    "flex min-h-12 shrink-0 items-center gap-1.5 rounded-xl bg-[#C8460F] px-4 text-[15px] font-semibold text-white"
