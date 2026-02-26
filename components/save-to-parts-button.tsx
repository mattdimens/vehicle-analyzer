"use client"

import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { useSaveToSupabase } from "@/hooks/use-save-to-supabase"
import type { PartIdentification } from "@/app/actions"

interface SaveToPartsButtonProps {
    partImageUrl: string
    partIdentification: PartIdentification
}

export const PENDING_PARTS_SAVE_KEY = "pending_parts_save"

export function SaveToPartsButton({ partImageUrl, partIdentification }: SaveToPartsButtonProps) {
    const { save, isSaving, isSaved } = useSaveToSupabase({
        table: "identified_parts",
        pendingStorageKey: PENDING_PARTS_SAVE_KEY,
        entityLabel: "part",
    })

    const handleSave = () => {
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

        save({
            part_name: partIdentification.partName,
            part_category: partIdentification.category,
            brand: null,
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
        })
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
