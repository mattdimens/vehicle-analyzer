"use client"

import { Info } from "lucide-react"
import { useState } from "react"

export function AffiliateDisclosure() {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="border-t border-border/40 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
            <div className="container max-w-6xl py-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        <Info className="h-3 w-3" />
                    </div>
                    <div className="flex-1 text-sm">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="group inline-flex items-center gap-2 font-medium text-amber-900 hover:text-amber-700 dark:text-amber-100 dark:hover:text-amber-200"
                        >
                            <span>Affiliate Disclosure</span>
                            <svg
                                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isExpanded && (
                            <p className="mt-2 leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                                Some links to Amazon on this site are affiliate links, meaning Visual Fitment may earn a small commission if you make a purchase through these links, at no additional cost to you. This helps support the development and maintenance of this free tool. Thank you for your support!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
