"use client"

import { Trash2, Edit2, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { IdentifiedPart } from "./garage-dashboard"
import { useState } from "react"
import { supabaseClient } from "@/lib/supabase-client"
import { toast } from "sonner"
import { PartDetailSheet } from "./part-detail-sheet"
import { addAmazonAffiliateTag } from "@/lib/amazon"
import Image from "next/image"
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
    onDeleted: (id: string) => void
    onUpdated: (id: string, updates: Partial<IdentifiedPart>) => void
}

export function PartCard({ part, index = 0, onDeleted, onUpdated }: PartCardProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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

    const searchQuery = `${part.vehicle_year || ''} ${part.vehicle_make || ''} ${part.vehicle_model || ''} ${part.part_name || ''}`.trim()

    return (
        <>
            <div
                className="group relative flex flex-col bg-white rounded-[2rem] border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 overflow-hidden cursor-pointer animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setIsSheetOpen(true)}
            >
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                    {part.photo_url ? (
                        <img
                            src={part.photo_url}
                            alt={part.part_name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-gray-100">
                            No Photo
                        </div>
                    )}

                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10">
                        <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold shadow-sm text-primary uppercase tracking-wider">
                            {part.part_category}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 group">
                        <div className="min-w-0 pr-4">
                            <h3 className="text-xl font-bold font-heading text-foreground/90 line-clamp-2 leading-tight mb-1">
                                {part.part_name}
                            </h3>
                            {part.vehicle_make && (
                                <p className="text-sm text-muted-foreground truncate font-medium flex items-center gap-1.5">
                                    <Car className="h-3.5 w-3.5 shrink-0" />
                                    {part.vehicle_year} {part.vehicle_make} {part.vehicle_model} {part.vehicle_trim && part.vehicle_trim !== "Base" ? part.vehicle_trim : ""}
                                </p>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 -mr-2 shrink-0"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                            title="Delete part"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {part.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {part.description}
                        </p>
                    )}

                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-border/40">
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <Edit2 className="h-3 w-3" />
                            Notes
                        </span>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 px-4 rounded-full hover:bg-[#D1E7F0] border-primary/20"
                            onClick={(e) => e.stopPropagation()} // Don't trigger the sheet
                        >
                            <a
                                href={addAmazonAffiliateTag(`https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center"
                            >
                                <span className="sr-only">Search on Amazon</span>
                                <Image
                                    src="/amazon-logo.png"
                                    alt="Amazon"
                                    width={64}
                                    height={20}
                                    className="h-4 w-auto object-contain mt-1"
                                />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sheet/Modal controlled by local state */}
            {isSheetOpen && (
                <PartDetailSheet
                    isOpen={isSheetOpen}
                    onClose={() => setIsSheetOpen(false)}
                    part={part}
                    onUpdated={onUpdated}
                />
            )}

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
