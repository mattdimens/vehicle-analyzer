"use client"

import { useEffect } from "react"
import { trackEvent, getEntryDoor } from "@/lib/analytics"

export function AnalyticsTracker() {
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a')
            if (target && target.href.includes('/go?')) {
                try {
                    const url = new URL(target.href)
                    const rawSource = url.searchParams.get('source') || 'unknown'
                    
                    let sourcePage = rawSource
                    if (rawSource === 'vehicle-page') sourcePage = 'vehicle_page'
                    else if (rawSource === 'detected-products' || rawSource === 'recommended-accessories' || rawSource === 'part-identification') sourcePage = 'results'
                    else if (rawSource === 'category-card' || rawSource === 'category_card') sourcePage = 'category_card'
                    else if (rawSource === 'sample-card' || rawSource === 'sample_card') sourcePage = 'sample_card'
                    
                    let catalogMatch: boolean | undefined = undefined
                    if (sourcePage === 'vehicle_page') {
                        catalogMatch = true
                    }
                    
                    trackEvent('affiliate_click', {
                        entry_door: getEntryDoor(),
                        source_page: sourcePage,
                        ...(catalogMatch !== undefined ? { catalog_match: catalogMatch } : {})
                    })
                } catch (err) {
                    // Ignore parse errors
                }
            }
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [])

    return null
}
