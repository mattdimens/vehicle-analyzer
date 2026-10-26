'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { supabaseClient } from '@/lib/supabase-client'
import { formatVehicleLabel } from '@/lib/part-vehicle'

/** Labels per user id, so several part results on a page share one query. */
const labelCache = new Map<string, Promise<string[]>>()

function fetchGarageVehicleLabels(userId: string, limit: number): Promise<string[]> {
    const cached = labelCache.get(userId)
    if (cached) return cached

    const request = (async () => {
        // RLS already limits rows to the user; the filter is defense in depth
        const { data, error } = await supabaseClient
            .from('garage_vehicles')
            .select('year, make, model')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)
        if (error) {
            labelCache.delete(userId)
            return []
        }
        const labels = (data ?? []).map(row => formatVehicleLabel(row.year, row.make, row.model)).filter(Boolean)
        return Array.from(new Set(labels))
    })()
    labelCache.set(userId, request)
    return request
}

/**
 * "2019 Toyota Tacoma" style labels for the signed-in visitor's most recent
 * garage vehicles. Empty while loading, when signed out, or on any error.
 */
export function useGarageVehicleLabels(limit = 2): string[] {
    const { user } = useAuth()
    const userId = user?.id ?? null
    const [result, setResult] = useState<{ userId: string; labels: string[] } | null>(null)

    useEffect(() => {
        if (!userId) return
        let cancelled = false
        fetchGarageVehicleLabels(userId, limit).then(labels => {
            if (!cancelled) setResult({ userId, labels })
        })
        return () => {
            cancelled = true
        }
    }, [userId, limit])

    return userId && result?.userId === userId ? result.labels : []
}
