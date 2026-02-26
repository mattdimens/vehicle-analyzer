'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { supabaseClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

interface UseSaveToSupabaseOptions {
    /** Supabase table name */
    table: string
    /** localStorage key for pending saves (pre-auth) */
    pendingStorageKey: string
    /** Label for toast messages, e.g. "vehicle" or "part" */
    entityLabel: string
}

/**
 * Shared hook for saving data to Supabase with auth-aware pending save logic.
 * Extracts the duplicate pattern from SaveToGarageButton and SaveToPartsButton.
 */
export function useSaveToSupabase({ table, pendingStorageKey, entityLabel }: UseSaveToSupabaseOptions) {
    const { session, signInWithGoogle } = useAuth()
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const save = async (data: Record<string, unknown>) => {
        if (isSaved) return

        if (!session?.user) {
            // Unauthenticated: Save to local storage and trigger sign in
            localStorage.setItem(pendingStorageKey, JSON.stringify(data))
            toast(`Please sign in to save this ${entityLabel} to your garage.`)
            signInWithGoogle()
            return
        }

        // Authenticated: Save directly to Supabase
        setIsSaving(true)
        try {
            const { error } = await supabaseClient.from(table).insert({
                ...data,
                user_id: session.user.id,
            })

            if (error) throw error

            setIsSaved(true)
            toast.success(`${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} saved to your garage!`)
        } catch (error) {
            console.error(`Error saving ${entityLabel}:`, error)
            toast.error(`Failed to save ${entityLabel}. Please try again.`)
        } finally {
            setIsSaving(false)
        }
    }

    return { save, isSaving, isSaved }
}
