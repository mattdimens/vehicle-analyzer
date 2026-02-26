'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createClient, Session, User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { PENDING_GARAGE_SAVE_KEY } from '@/components/save-to-garage-button'
import { PENDING_PARTS_SAVE_KEY } from '@/components/save-to-parts-button'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface AuthContextType {
    session: Session | null
    user: User | null
    isLoading: boolean
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    signInWithGoogle: async () => { },
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Guard against duplicate pending-save processing (Issue #10)
    const isProcessingPendingSaveRef = useRef(false)

    useEffect(() => {
        // Function to process pending save from localStorage
        const processPendingSave = async (userId: string) => {
            // Prevent duplicate processing from getSession + onAuthStateChange race
            if (isProcessingPendingSaveRef.current) return
            isProcessingPendingSaveRef.current = true

            try {
                const pendingSave = localStorage.getItem(PENDING_GARAGE_SAVE_KEY)
                if (pendingSave) {
                    const vehicleData = JSON.parse(pendingSave)
                    // Remove from localStorage FIRST to prevent duplicate inserts on retry
                    localStorage.removeItem(PENDING_GARAGE_SAVE_KEY)

                    const { error } = await supabase.from('garage_vehicles').insert({
                        ...vehicleData,
                        user_id: userId,
                    })

                    if (error) {
                        // Restore if insert failed so user can retry
                        localStorage.setItem(PENDING_GARAGE_SAVE_KEY, pendingSave)
                        throw error
                    }

                    setTimeout(() => {
                        toast.success("Pending vehicle successfully saved to your garage!")
                    }, 500)
                }

                const pendingPartsSave = localStorage.getItem(PENDING_PARTS_SAVE_KEY)
                if (pendingPartsSave) {
                    const partData = JSON.parse(pendingPartsSave)
                    // Remove from localStorage FIRST to prevent duplicate inserts
                    localStorage.removeItem(PENDING_PARTS_SAVE_KEY)

                    const { error } = await supabase.from('identified_parts').insert({
                        ...partData,
                        user_id: userId,
                    })

                    if (error) {
                        localStorage.setItem(PENDING_PARTS_SAVE_KEY, pendingPartsSave)
                        throw error
                    }

                    setTimeout(() => {
                        toast.success("Pending part successfully saved to your garage!")
                    }, 500)
                }
            } catch (error) {
                console.error("Error processing pending save:", error)
            } finally {
                isProcessingPendingSaveRef.current = false
            }
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setIsLoading(false)
            if (session?.user) {
                processPendingSave(session.user.id)
            }
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setIsLoading(false)
            if (session?.user && _event === 'SIGNED_IN') {
                processPendingSave(session.user.id)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // Issue #15 — use current path as redirect instead of hardcoding /my-garage
    const signInWithGoogle = useCallback(async () => {
        const redirectPath = typeof window !== 'undefined' ? window.location.pathname : '/my-garage'
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}${redirectPath}`,
            },
        })
    }, [])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
    }, [])

    // Issue #11 — memoize context value to prevent unnecessary re-renders
    const value = useMemo(
        () => ({ session, user, isLoading, signInWithGoogle, signOut }),
        [session, user, isLoading, signInWithGoogle, signOut]
    )

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}
