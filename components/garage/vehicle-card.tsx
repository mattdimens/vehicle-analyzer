import { Trash2, Link as IconLink, Pencil, Search, Expand } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GarageVehicle } from "./garage-dashboard"
import { useState } from "react"
import { VehicleDetailSheet } from "./vehicle-detail-sheet"
import { supabaseClient } from "@/lib/supabase-client"
import { toast } from "sonner"

interface VehicleCardProps {
    vehicle: GarageVehicle
    onDeleted: (id: string) => void
    onUpdated: (id: string, updates: Partial<GarageVehicle>) => void
}

export function VehicleCard({ vehicle, onDeleted, onUpdated }: VehicleCardProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Ensure we handle the count array from the join properly
    const partsCount = Array.isArray(vehicle.saved_parts)
        ? vehicle.saved_parts[0]?.count || 0
        : 0

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation() // Don't trigger sheet open

        if (!confirm("Are you sure you want to delete this vehicle and all saved parts?")) return

        setIsDeleting(true)
        try {
            const { error } = await supabaseClient
                .from("garage_vehicles")
                .delete()
                .eq("id", vehicle.id)

            if (error) throw error

            toast.success("Vehicle deleted successfully")
            onDeleted(vehicle.id) // update parent state
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete vehicle")
            setIsDeleting(false)
        }
    }

    return (
        <>
            <div
                className="group relative flex flex-col bg-white rounded-[2rem] border border-border/40 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
                onClick={() => setIsSheetOpen(true)}
            >
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                    {vehicle.photo_url ? (
                        <img
                            src={vehicle.photo_url}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-gray-100">
                            No Photo
                        </div>
                    )}

                    {/* Expand overlay icon */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all bg-white/90 backdrop-blur rounded-full p-3 shadow-lg">
                            <Expand className="h-5 w-5 text-gray-800" />
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10">
                        <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5">
                            <IconLink className="h-3 w-3" />
                            {partsCount} Parts
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 group">
                        <div className="min-w-0 pr-4">
                            {vehicle.nickname ? (
                                <>
                                    <h3 className="text-xl font-bold font-heading truncate flex items-center gap-2 text-foreground/90">
                                        {vehicle.nickname}
                                    </h3>
                                    <p className="text-sm text-muted-foreground truncate font-medium">
                                        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim && vehicle.trim !== "Base" ? vehicle.trim : ""}
                                    </p>
                                </>
                            ) : (
                                <h3 className="text-xl font-bold font-heading truncate text-foreground/90">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                    {vehicle.trim && vehicle.trim !== "Base" && <span className="ml-1 text-muted-foreground font-normal">{vehicle.trim}</span>}
                                </h3>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 -mr-2"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            title="Delete vehicle"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/40">
                        <span className="text-xs text-muted-foreground">
                            Added {new Date(vehicle.created_at).toLocaleDateString()}
                        </span>
                        <div className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                            View Details
                        </div>
                    </div>
                </div>
            </div>

            {/* Sheet/Modal controlled by local state */}
            {isSheetOpen && (
                <VehicleDetailSheet
                    isOpen={isSheetOpen}
                    onClose={() => setIsSheetOpen(false)}
                    vehicle={vehicle}
                    onUpdated={onUpdated}
                />
            )}
        </>
    )
}
