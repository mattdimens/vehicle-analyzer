'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient, Session, User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { PENDING_GARAGE_SAVE_KEY } from '@/components/save-to-garage-button'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface AuthContextType {
    session: Session | null
    user: User | null
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    signInWithGoogle: async () => { },
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        // Function to process pending save from localStorage
        const processPendingSave = async (userId: string) => {
            try {
                const pendingSave = localStorage.getItem(PENDING_GARAGE_SAVE_KEY)
                if (pendingSave) {
                    const vehicleData = JSON.parse(pendingSave)

                    const { error } = await supabase.from('garage_vehicles').insert({
                        ...vehicleData,
                        user_id: userId,
                    })

                    if (error) throw error

                    localStorage.removeItem(PENDING_GARAGE_SAVE_KEY)
                    // Short timeout to ensure toast renders if we are redirecting
                    setTimeout(() => {
                        toast.success("Pending vehicle successfully saved to your garage!")
                    }, 500)
                }
            } catch (error) {
                console.error("Error processing pending save:", error)
            }
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
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
            if (session?.user && _event === 'SIGNED_IN') {
                processPendingSave(session.user.id)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/my-garage`,
            },
        })
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ session, user, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}
