"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { supabaseClient } from "@/lib/supabase-client"
import { toast } from "sonner"
import type { AnalysisResults } from "@/app/actions"

interface SaveToGarageButtonProps {
    vehicleImageUrl: string
    results: AnalysisResults
}

export const PENDING_GARAGE_SAVE_KEY = "pending_garage_save"

export function SaveToGarageButton({ vehicleImageUrl, results }: SaveToGarageButtonProps) {
    const { session, signInWithGoogle } = useAuth()
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const handleSave = async () => {
        if (isSaved) return

        const vehicleData = {
            year: results.primary.year,
            make: results.primary.make,
            model: results.primary.model,
            trim: results.primary.trim,
            photo_url: vehicleImageUrl,
            identified_via: "ai_photo",
            ai_identification_data: results,
        }

        if (!session?.user) {
            // Unauthenticated: Save to local storage and trigger sign in
            localStorage.setItem(PENDING_GARAGE_SAVE_KEY, JSON.stringify(vehicleData))
            toast("Please sign in to save this vehicle to your garage.")
            signInWithGoogle()
            return
        }

        // Authenticated: Save directly to Supabase
        setIsSaving(true)
        try {
            const { error } = await supabaseClient.from("garage_vehicles").insert({
                ...vehicleData,
                user_id: session.user.id,
            })

            if (error) throw error

            setIsSaved(true)
            toast.success("Vehicle saved to your garage!")
        } catch (error) {
            console.error("Error saving vehicle:", error)
            toast.error("Failed to save vehicle. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Button
            variant={isSaved ? "secondary" : "default"}
            className="w-full sm:w-auto mt-4 sm:mt-0"
            onClick={handleSave}
            disabled={isSaving || isSaved}
        >
            {isSaving ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
            ) : isSaved ? (
                <>
                    <BookmarkCheck className="mr-2 h-4 w-4 text-emerald-500" />
                    Saved to Garage
                </>
            ) : (
                <>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save to My Garage
                </>
            )}
        </Button>
    )
}
