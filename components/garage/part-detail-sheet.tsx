"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { supabaseClient } from "@/lib/supabase-client"
import { Loader2, Edit2, Check, Search, Car, Sparkles, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { IdentifiedPart } from "./garage-dashboard"
import { addAmazonAffiliateTag } from "@/lib/amazon"

interface PartDetailSheetProps {
    isOpen: boolean
    onClose: () => void
    part: IdentifiedPart
    onUpdated: (id: string, updates: Partial<IdentifiedPart>) => void
}

export function PartDetailSheet({ isOpen, onClose, part, onUpdated }: PartDetailSheetProps) {
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const [notesInput, setNotesInput] = useState(part.description || "")
    const [isSavingNotes, setIsSavingNotes] = useState(false)

    const handleSaveNotes = async () => {
        const newNotes = notesInput.trim() || null
        if (newNotes === part.description) {
            setIsEditingNotes(false)
            return
        }

        setIsSavingNotes(true)
        try {
            const { error } = await supabaseClient
                .from("identified_parts")
                .update({ description: newNotes })
                .eq("id", part.id)

            if (error) throw error

            onUpdated(part.id, { description: newNotes })
            toast.success("Part notes updated")
            setIsEditingNotes(false)
        } catch (error) {
            console.error("Error updating notes:", error)
            toast.error("Failed to update notes")
        } finally {
            setIsSavingNotes(false)
        }
    }

    const isLowConfidence = part.confidence && part.confidence < 30
    const confidenceColor = part.confidence && part.confidence >= 80 ? "text-emerald-600"
        : part.confidence && part.confidence >= 50 ? "text-amber-600"
            : "text-red-500"

    const isUnknownBrand = !part.brand || part.brand.toLowerCase().includes("unknown")
    const isUnknownModel = !part.part_number || part.part_number.toLowerCase().includes("unknown")
    const vehicleDetails = `${part.vehicle_year || ''} ${part.vehicle_make || ''} ${part.vehicle_model || ''}`.trim()

    let searchQuery = ""
    if (vehicleDetails) {
        if (isUnknownBrand || isUnknownModel) {
            searchQuery = `${vehicleDetails} ${part.part_name}`
        } else {
            searchQuery = `${vehicleDetails} ${part.brand} ${part.part_number}`
        }
    } else {
        if (!isUnknownBrand && !isUnknownModel) {
            searchQuery = `${part.brand} ${part.part_number}`
        } else {
            searchQuery = part.part_name
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <div className="relative w-full h-48 md:h-64 bg-muted shrink-0">
                    {part.photo_url ? (
                        <img
                            src={part.photo_url}
                            alt={part.part_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                            <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-4 left-4 z-10">
                        <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold shadow-sm text-primary uppercase tracking-wider">
                            {part.part_category}
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-6 right-6">
                        <DialogTitle className="text-2xl md:text-3xl font-bold font-heading text-white mb-2">
                            {part.part_name}
                        </DialogTitle>
                        {part.vehicle_make && (
                            <DialogDescription className="text-white/80 font-medium text-sm md:text-base flex items-center gap-1.5">
                                <Car className="h-4 w-4" />
                                Fitment: {part.vehicle_year} {part.vehicle_make} {part.vehicle_model} {part.vehicle_trim && part.vehicle_trim !== "Base" ? part.vehicle_trim : ""}
                            </DialogDescription>
                        )}
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    {isLowConfidence && (
                        <div className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-red-50 border border-red-200">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">
                                Low confidence AI match: this might not be an accurate identification, or the image may be unclear. Verify the part details manually.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {/* AI Details section */}
                            <div>
                                <h3 className="text-lg font-bold font-heading mb-4 border-b pb-2 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    AI Identification Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Brand</span>
                                            <span className="font-medium">{part.brand || <span className="italic text-muted-foreground text-xs">Unknown</span>}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Model / Part #</span>
                                            <span className="font-medium">{part.part_number || <span className="italic text-muted-foreground text-xs">Unknown</span>}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Confidence</span>
                                            <span className={`font-bold ${confidenceColor}`}>{part.confidence ? `${part.confidence}%` : 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block mb-1">Estimated Price</span>
                                            <span className="font-medium text-emerald-600 font-semibold">{part.estimated_price ? `$${part.estimated_price}` : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Search Action */}
                            <div className="pt-4 border-t border-border/40">
                                <Button
                                    asChild
                                    size="lg"
                                    className="w-full bg-[#FF9900] hover:bg-[#E38900] text-black border-none rounded-full"
                                >
                                    <a
                                        href={addAmazonAffiliateTag(`https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2"
                                    >
                                        <Search className="h-4 w-4" />
                                        Search on Amazon
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4 border-b pb-2">
                                <h3 className="text-lg font-bold font-heading flex items-center gap-2">
                                    <Edit2 className="h-4 w-4 text-primary" />
                                    Notes & Description
                                </h3>
                                {!isEditingNotes && (
                                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setIsEditingNotes(true)}>
                                        Edit
                                    </Button>
                                )}
                            </div>

                            {isEditingNotes ? (
                                <div className="space-y-3">
                                    <Textarea
                                        className="min-h-[120px] resize-none"
                                        value={notesInput}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotesInput(e.target.value)}
                                        placeholder="Add your own notes, links, or description here..."
                                        autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="secondary" size="sm" onClick={() => { setIsEditingNotes(false); setNotesInput(part.description || "") }}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" onClick={handleSaveNotes} disabled={isSavingNotes} className="bg-emerald-600 hover:bg-emerald-700">
                                            {isSavingNotes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                            Save Notes
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-xl border border-border/40 min-h-[120px]">
                                    {part.description || <span className="text-muted-foreground italic">No notes or description added yet. Click edit to add your own notes.</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
