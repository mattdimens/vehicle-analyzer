import { Trash2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GarageVehicle } from "./garage-dashboard"
import { useState } from "react"
import { supabaseClient } from "@/lib/supabase-client"
import { useAuth } from "@/components/auth-provider"
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
import type { DetectedProduct } from "@/app/actions"

interface VehicleCardProps {
    vehicle: GarageVehicle
    index?: number
    isActive?: boolean
    onClick: (vehicle: GarageVehicle) => void
    onDeleted: (id: string) => void
}

export function VehicleCard({ vehicle, index = 0, isActive = false, onClick, onDeleted }: VehicleCardProps) {
    const { session } = useAuth()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const detectedProducts = ((vehicle.ai_identification_data as Record<string, unknown>)?.detectedProducts as DetectedProduct[]) ?? []
    const partsCount = detectedProducts.length

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation() // Don't trigger select
        setIsDeleteDialogOpen(true)
    }

    // Issue #4: defense-in-depth: include user_id in delete filter
    const confirmDelete = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        setIsDeleteDialogOpen(false)
        setIsDeleting(true)
        try {
            const query = supabaseClient
                .from("garage_vehicles")
                .delete()
                .eq("id", vehicle.id)

            // Add user_id filter if session is available
            if (session?.user?.id) {
                query.eq("user_id", session.user.id)
            }

            const { error } = await query

            if (error) throw error

            toast.success("Vehicle deleted successfully")
            onDeleted(vehicle.id) // update parent state
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete vehicle")
            setIsDeleting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(vehicle)
        }
    }

    return (
        <>
            {/* Issue #27: add role="button", tabIndex, keyboard handler for a11y */}
            <div
                role="button"
                tabIndex={0}
                aria-selected={isActive}
                className={`group relative flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer animate-in fade-in slide-in-from-left-4 fill-mode-both
                ${isActive ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-border/40 hover:border-primary/40 hover:shadow-sm'}`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onClick(vehicle)}
                onKeyDown={handleKeyDown}
            >
                {/* Thumbnail */}
                <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {vehicle.photo_url ? (
                        <img
                            src={vehicle.photo_url}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground bg-gray-100">
                            No Photo
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                    {vehicle.nickname ? (
                        <>
                            <h3 className={`font-semibold truncate text-sm leading-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                {vehicle.nickname}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate font-medium">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                            </p>
                        </>
                    ) : (
                        <h3 className={`font-semibold truncate text-sm leading-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                    )}

                    {partsCount > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                            <Sparkles className="h-3 w-3" />
                            {partsCount} part{partsCount === 1 ? "" : "s"}
                        </div>
                    )}
                </div>

                {/* Delete Action (visible on hover) */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute right-2 h-8 w-8 text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    aria-label={`Delete ${vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

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
