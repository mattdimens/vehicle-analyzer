"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getEntryDoor, getPlatform, trackEvent } from "@/lib/analytics"
import { cn } from "@/lib/utils"

/**
 * Compact pieces for the sample results on the homepage and /part-identifier.
 * Each sample is one link to a real /r/ result: the "Find it" and "Shop"
 * items inside are labels showing what a result offers, never controls, so
 * there are no /go links here. Photo, category label and match pill come
 * from the results shell (result-shell.tsx), so a sample matches the page
 * it opens.
 */

export type SamplePage = "homepage" | "part_identifier"

/** A small uppercase label on the hero, above a card. */
export function HeroEyebrow({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <p className={cn("text-xs font-semibold uppercase tracking-[0.08em] text-[#9A3412]", className)}>
            {children}
        </p>
    )
}

/** "Sample result", above the sample card. */
export function SampleEyebrow({ className }: { className?: string }) {
    return <HeroEyebrow className={className}>Sample result</HeroEyebrow>
}

/** Under the card, on the hero, so nobody takes the sample for their own result. */
export function SampleCaption({ className }: { className?: string }) {
    return <p className={cn("text-xs text-[#5A6672]", className)}>Example from one uploaded photo</p>
}

/** The whole card: one link to the full sample result. */
export function SampleCardLink({ href, ariaLabel, page, className, children }: {
    href: string
    ariaLabel: string
    page: SamplePage
    className?: string
    children: ReactNode
}) {
    return (
        <Link
            href={href}
            aria-label={ariaLabel}
            onClick={() => trackEvent("sample_result_click", { page, platform: getPlatform(), entry_door: getEntryDoor() })}
            className={cn(
                "group block rounded-2xl border border-[#D5DEE5] bg-white text-[#17212B] no-underline transition-colors hover:border-[#17212B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#17212B]/30",
                className
            )}
        >
            {children}
        </Link>
    )
}

/** The name of a sample (vehicle or part): a styled paragraph, since each page already has its H1. */
export function SampleTitle({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn("font-heading font-bold leading-[1.15] text-[#17212B]", className)}>{children}</p>
}

/** A shop action shown as a label ("Find it", "Shop ... for ..."). */
export function SampleShopLabel({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <span className={cn("shrink-0 rounded-lg bg-[#FDEEE6] px-2.5 py-1 text-xs font-semibold text-[#9A3412]", className)}>
            {children}
        </span>
    )
}

/** A detected item: type over brand and model, with a "Find it" label. */
export function SampleItemRow({ title, detail, className }: { title: string; detail?: string | null; className?: string }) {
    return (
        <li className={cn("flex items-center justify-between gap-2.5 border-b border-[#F0F3F6] py-2", className)}>
            <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">{title}</span>
                {detail && <span className="text-xs text-[#5A6672]">{detail}</span>}
            </span>
            <SampleShopLabel>Find it</SampleShopLabel>
        </li>
    )
}

/** A small outlined chip (recommended accessories, related parts). */
export function SampleChip({ children }: { children: ReactNode }) {
    return <span className="rounded-lg border border-[#D5DEE5] px-2 py-1 text-xs text-[#17212B]">{children}</span>
}

/** Small grey heading inside a sample panel. */
export function SampleLabel({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn("text-[13px] font-semibold text-[#5A6672]", className)}>{children}</p>
}

/**
 * "See the full sample result". Narrow: a full-width outlined button.
 * Wide (from `wideFrom`): an orange text label at the bottom right.
 */
export function SampleSeeFull({ wideFrom }: { wideFrom: "md" | "lg" }) {
    return (
        <span
            className={cn(
                "flex min-h-12 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-[#17212B] text-[15px] font-semibold text-[#17212B] transition-colors group-hover:bg-[#F4F7F9]",
                wideFrom === "md"
                    ? "md:mt-auto md:min-h-0 md:self-end md:border-0 md:pt-3 md:text-sm md:text-[#9A3412] md:group-hover:bg-transparent md:group-hover:text-[#7C2D12]"
                    : "lg:mt-auto lg:min-h-0 lg:self-end lg:border-0 lg:pt-1 lg:text-sm lg:text-[#9A3412] lg:group-hover:bg-transparent lg:group-hover:text-[#7C2D12]"
            )}
        >
            See the full sample result
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
    )
}
