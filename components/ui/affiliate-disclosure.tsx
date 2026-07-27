import { Info } from "lucide-react"

/**
 * AffiliateDisclosure
 *
 * Plain-language affiliate disclosure visible without clicking.
 * Positioned near product recommendation areas on the homepage
 * and vehicle pages.
 */
export function AffiliateDisclosure() {
    return (
        <div className="border-t border-border/40 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
            <div className="container max-w-6xl py-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        <Info className="h-3 w-3" />
                    </div>
                    <p className="text-sm leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                        Some links on Visual Fitment are affiliate links. If you buy through them, we may earn a commission at no extra cost to you.
                    </p>
                </div>
            </div>
        </div>
    )
}
