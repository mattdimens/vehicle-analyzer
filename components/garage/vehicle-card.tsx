import { Trash2, Expand, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GarageVehicle } from "./garage-dashboard"
import { useState } from "react"
import { VehicleDetailSheet } from "./vehicle-detail-sheet"
import { supabaseClient } from "@/lib/supabase-client"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface VehicleCardProps {
    vehicle: GarageVehicle
    index?: number
    onDeleted: (id: string) => void
    onUpdated: (id: string, updates: Partial<GarageVehicle>) => void
}

export function VehicleCard({ vehicle, index = 0, onDeleted, onUpdated }: VehicleCardProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const detectedProducts = (vehicle.ai_identification_data?.detectedProducts as any[]) || []
    const partsCount = detectedProducts.length

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation() // Don't trigger sheet open
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        setIsDeleteDialogOpen(false)
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
                className="group relative flex flex-col bg-white rounded-[2rem] border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 overflow-hidden cursor-pointer animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                style={{ animationDelay: `${index * 100}ms` }}
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

                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 group">
                        <div className="min-w-0 pr-4 flex-1">
                            {vehicle.nickname ? (
                                <>
                                    <h3 className="text-xl font-bold font-heading line-clamp-2 text-foreground/90">
                                        {vehicle.nickname}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5 font-medium">
                                        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim && vehicle.trim !== "Base" ? vehicle.trim : ""}
                                    </p>
                                </>
                            ) : (
                                <h3 className="text-xl font-bold font-heading line-clamp-2 text-foreground/90 leading-tight">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                    {vehicle.trim && vehicle.trim !== "Base" && <span className="ml-1 text-muted-foreground font-normal">{vehicle.trim}</span>}
                                </h3>
                            )}

                            {/* Parts Count Badge */}
                            {partsCount > 0 && (
                                <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm">
                                    <Sparkles className="h-3 w-3" />
                                    {partsCount} part{partsCount === 1 ? "" : "s"} identified
                                </div>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 -mr-2"
                            onClick={handleDeleteClick}
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent onClick={e => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove this vehicle from your garage? This can&apos;t be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={e => e.stopPropagation()}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
