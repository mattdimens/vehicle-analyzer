import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

const DISCLOSURE_TEXT =
    "Some links on Visual Fitment are affiliate links. If you buy through them, we may earn a commission at no extra cost to you."

/**
 * AffiliateDisclosure
 *
 * Plain-language affiliate disclosure visible without clicking.
 * Positioned near product recommendation areas on the homepage
 * and vehicle pages.
 *
 * variant="inline": one muted line with no band, for the vehicle pages.
 */
export function AffiliateDisclosure({ variant = "band", className }: { variant?: "band" | "inline"; className?: string }) {
    if (variant === "inline") {
        return (
            <p className={cn("flex items-start gap-1.5 text-xs leading-snug text-[#5A6672]", className)}>
                <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{DISCLOSURE_TEXT}</span>
            </p>
        )
    }

    return (
        <div className={cn("border-t border-border/40 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20", className)}>
            <div className="container max-w-6xl py-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        <Info className="h-3 w-3" />
                    </div>
                    <p className="text-sm leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                        {DISCLOSURE_TEXT}
                    </p>
                </div>
            </div>
        </div>
    )
}
