import { Trash2, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { IdentifiedPart } from "./garage-dashboard"
import { useState } from "react"
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

interface PartCardProps {
    part: IdentifiedPart
    index?: number
    isActive?: boolean
    onClick: (part: IdentifiedPart) => void
    onDeleted: (id: string) => void
}

export function PartCard({ part, index = 0, isActive = false, onClick, onDeleted }: PartCardProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation() // Don't trigger select
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        setIsDeleteDialogOpen(false)
        setIsDeleting(true)
        try {
            const { error } = await supabaseClient
                .from("identified_parts")
                .delete()
                .eq("id", part.id)

            if (error) throw error

            toast.success("Part deleted successfully")
            onDeleted(part.id)
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete part")
            setIsDeleting(false)
        }
    }

    return (
        <>
            <div
                className={`group relative flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer animate-in fade-in slide-in-from-left-4 fill-mode-both 
                ${isActive ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-border/40 hover:border-primary/40 hover:shadow-sm'}`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onClick(part)}
            >
                {/* Thumbnail */}
                <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {part.photo_url ? (
                        <img
                            src={part.photo_url}
                            alt={part.part_name}
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
                    <h3 className={`font-semibold truncate text-sm leading-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {part.part_name}
                    </h3>

                    <p className="text-xs text-muted-foreground truncate font-medium mt-0.5 uppercase tracking-wider">
                        {part.part_category}
                    </p>

                    {part.vehicle_make && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                            <Car className="h-3 w-3" />
                            <span className="truncate">{part.vehicle_year} {part.vehicle_make} {part.vehicle_model}</span>
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
                    title="Delete part"
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
                            Remove this part from your garage? This can&apos;t be undone.
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
