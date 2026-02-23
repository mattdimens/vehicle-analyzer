"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { supabaseClient } from "@/lib/supabase-client"
import { toast } from "sonner"
import type { PartIdentification } from "@/app/actions"

interface SaveToPartsButtonProps {
    partImageUrl: string
    partIdentification: PartIdentification
}

export const PENDING_PARTS_SAVE_KEY = "pending_parts_save"

export function SaveToPartsButton({ partImageUrl, partIdentification }: SaveToPartsButtonProps) {
    const { session, signInWithGoogle } = useAuth()
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const handleSave = async () => {
        if (isSaved) return

        // Extract vehicle info if available in estimatedVehicle string (e.g. "2019 Ford F-150")
        let year, make, model
        const trim = null
        if (partIdentification.estimatedVehicle) {
            const parts = partIdentification.estimatedVehicle.split(' ')
            if (parts.length >= 3 && !isNaN(parseInt(parts[0]))) {
                year = parts[0]
                make = parts[1]
                model = parts.slice(2).join(' ')
            }
        }

        const partData = {
            part_name: partIdentification.partName,
            part_category: partIdentification.category,
            brand: null, // AI doesn't always provide specific brand, could add later
            part_number: null,
            estimated_price: null,
            affiliate_url: null,
            description: partIdentification.function,
            confidence: partIdentification.confidence,
            vehicle_year: year,
            vehicle_make: make,
            vehicle_model: model,
            vehicle_trim: trim,
            photo_url: partImageUrl,
            ai_identification_data: partIdentification,
        }

        if (!session?.user) {
            // Unauthenticated: Save to local storage and trigger sign in
            localStorage.setItem(PENDING_PARTS_SAVE_KEY, JSON.stringify(partData))
            toast("Please sign in to save this part to your garage.")
            signInWithGoogle()
            return
        }

        // Authenticated: Save directly to Supabase
        setIsSaving(true)
        try {
            const { error } = await supabaseClient.from("identified_parts").insert({
                ...partData,
                user_id: session.user.id,
            })

            if (error) throw error

            setIsSaved(true)
            toast.success("Part saved to your garage!")
        } catch (error) {
            console.error("Error saving part:", error)
            toast.error("Failed to save part. Please try again.")
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
                    Saved to Parts
                </>
            ) : (
                <>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save to My Parts
                </>
            )}
        </Button>
    )
}
