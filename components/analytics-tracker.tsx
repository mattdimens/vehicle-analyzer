"use client"

import { useEffect } from "react"
import { trackEvent, getEntryDoor, recordLandingPath } from "@/lib/analytics"

export function AnalyticsTracker() {
    useEffect(() => {
        recordLandingPath()

        const fireAffiliateClick = (target: HTMLAnchorElement) => {
            try {
                const url = new URL(target.href)
                const rawSource = url.searchParams.get('source') || 'unknown'
                
                let sourcePage = rawSource
                if (rawSource === 'vehicle-page') sourcePage = 'vehicle_page'
                else if (rawSource === 'detected-products' || rawSource === 'recommended-accessories' || rawSource === 'part-identification') sourcePage = 'results'
                // Part identifier links (part-vehicle, part-typed, part-sticky, ...) are all results clicks
                else if (rawSource.startsWith('part-')) sourcePage = 'results'
                else if (rawSource === 'category-card' || rawSource === 'category_card') sourcePage = 'category_card'
                else if (rawSource === 'sample-card' || rawSource === 'sample_card') sourcePage = 'sample_card'
                
                let catalogMatch: boolean | undefined = undefined
                if (sourcePage === 'vehicle_page') {
                    catalogMatch = true
                }
                
                trackEvent('affiliate_click', {
                    entry_door: getEntryDoor(),
                    source_page: sourcePage,
                    ...(catalogMatch !== undefined ? { catalog_match: catalogMatch } : {}),
                    // Which part identifier link was clicked
                    ...(rawSource.startsWith('part-') ? { link_type: rawSource } : {})
                })
            } catch {
                // Ignore parse errors
            }
        }

        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a')
            if (target && target.href.includes('/go?')) {
                fireAffiliateClick(target)
            }
        }

        const handleAuxClick = (e: MouseEvent) => {
            // Middle-click only (button 1)
            if (e.button !== 1) return
            const target = (e.target as HTMLElement).closest('a')
            if (target && target.href.includes('/go?')) {
                fireAffiliateClick(target)
            }
        }

        document.addEventListener('click', handleClick)
        document.addEventListener('auxclick', handleAuxClick)
        return () => {
            document.removeEventListener('click', handleClick)
            document.removeEventListener('auxclick', handleAuxClick)
        }
    }, [])

    return null
}
