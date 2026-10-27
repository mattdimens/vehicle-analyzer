"use client"

import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { useSaveToSupabase } from "@/hooks/use-save-to-supabase"
import { trackEvent, getPlatform } from "@/lib/analytics"
import type { AnalysisResults, DetectedProduct } from "@/app/actions"
import { cn } from "@/lib/utils"

interface SaveToGarageButtonProps {
    vehicleImageUrl: string
    results: AnalysisResults
    detectedProducts: DetectedProduct[]
    /** Look of the unsaved button. Saving and the save_to_garage event are the same either way. */
    variant?: "default" | "outline"
    className?: string
}

export const PENDING_GARAGE_SAVE_KEY = "pending_garage_save"

export function SaveToGarageButton({ vehicleImageUrl, results, detectedProducts, variant = "default", className }: SaveToGarageButtonProps) {
    const { save, isSaving, isSaved } = useSaveToSupabase({
        table: "garage_vehicles",
        pendingStorageKey: PENDING_GARAGE_SAVE_KEY,
        entityLabel: "vehicle",
        onSaveSuccess: () => trackEvent('save_to_garage', { platform: getPlatform() }),
    })

    const handleSave = () => {
        save({
            year: results.primary.year,
            make: results.primary.make,
            model: results.primary.model,
            trim: results.primary.trim,
            photo_url: vehicleImageUrl,
            identified_via: "ai_photo",
            ai_identification_data: {
                ...results,
                detectedProducts,
            },
        })
    }

    return (
        <Button
            variant={isSaved ? "secondary" : variant}
            className={cn("w-full sm:w-auto mt-4 sm:mt-0", className)}
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
