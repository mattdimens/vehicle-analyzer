"use client"

import { useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { supabaseClient } from "@/lib/supabase-client"
import { Loader2, Edit2, Check, Search, Car, Sparkles, AlertTriangle, Share } from "lucide-react"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { IdentifiedPart } from "./garage-dashboard"
import { addAmazonAffiliateTag } from "@/lib/amazon"

interface PartDetailSheetProps {
    isOpen: boolean
    onClose: () => void
    part: IdentifiedPart
    onUpdated: (id: string, updates: Partial<IdentifiedPart>) => void
}

export function PartDetailSheet({ isOpen, onClose, part, onUpdated }: PartDetailSheetProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const [notesInput, setNotesInput] = useState(part.description || "")
    const [isSavingNotes, setIsSavingNotes] = useState(false)

    const handleShare = () => {
        const text = `Check out this ${part.part_name} I identified from my garage!\n\nAutomotive Part: ${part.part_name}\nCategory: ${part.part_category}\n${part.vehicle_make ? `Fitment: ${part.vehicle_year} ${part.vehicle_make} ${part.vehicle_model}` : ''}\n\nSearch it on Amazon: https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`
        navigator.clipboard.writeText(text).then(() => {
            toast.success("Part details copied to clipboard!")
        }).catch(() => {
            toast.error("Failed to copy link")
        })
    }

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

    // Calculate progress ring colors and values
    const progressValue = part.confidence || 0
    let progressColorClass = "text-emerald-500"
    let progressBgClass = "text-emerald-500/20"
    if (progressValue < 50) {
        progressColorClass = "text-red-500"
        progressBgClass = "text-red-500/20"
    } else if (progressValue < 80) {
        progressColorClass = "text-amber-500"
        progressBgClass = "text-amber-500/20"
    }

    // Circumference for SVG circle (r=16 -> c=100.5)
    const circumference = 100.5
    const strokeDashoffset = circumference - (progressValue / 100) * circumference

    const confidenceColor = progressValue >= 80 ? "text-emerald-600"
        : progressValue >= 50 ? "text-amber-600"
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
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side={isDesktop ? "right" : "bottom"}
                className="p-0 flex flex-col gap-0 border-l border-t-0 md:border-t-border sm:max-w-xl md:max-w-2xl lg:max-w-3xl w-full max-h-[96vh] md:max-h-none rounded-t-[2rem] md:rounded-none overflow-hidden bg-background"
            >
                <div className="flex-1 overflow-y-auto">
                    {/* Header Image Section */}
                    <div className="relative w-full h-56 md:h-72 bg-muted shrink-0">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <div className="bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm text-primary flex items-center gap-1.5 uppercase tracking-wider">
                                <Sparkles className="h-3.5 w-3.5" />
                                {part.part_category}
                            </div>
                        </div>

                        <div className="absolute top-4 right-14 z-10">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="bg-white/20 hover:bg-white/40 text-white border-0 backdrop-blur-md h-8 w-8 rounded-full"
                                onClick={handleShare}
                                title="Share Part Details"
                            >
                                <Share className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="absolute bottom-6 left-6 right-6">
                            <SheetHeader className="text-left space-y-1">
                                <SheetTitle className="text-2xl md:text-3xl font-bold font-heading text-white line-clamp-2 leading-tight">
                                    {part.part_name}
                                </SheetTitle>
                                {part.vehicle_make && (
                                    <SheetDescription className="text-white/80 font-medium text-sm md:text-base flex items-center gap-1.5 mt-1">
                                        <Car className="h-4 w-4" />
                                        Fitment: {part.vehicle_year} {part.vehicle_make} {part.vehicle_model} {part.vehicle_trim && part.vehicle_trim !== "Base" ? part.vehicle_trim : ""}
                                    </SheetDescription>
                                )}
                            </SheetHeader>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {isLowConfidence && (
                            <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 shadow-sm">
                                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800 font-medium">
                                    Low confidence match. The image may be unclear, verify the part details manually.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                            {/* Identification Details section */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold font-heading mb-4 border-b border-border/60 pb-2 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        Identification Details
                                    </h3>
                                    <div className="bg-muted/30 rounded-2xl p-5 border border-border/50">
                                        <div className="grid grid-cols-1 gap-4 text-sm">
                                            <div className="flex justify-between items-center border-b border-border/40 pb-3">
                                                <span className="text-muted-foreground font-medium">Brand</span>
                                                <span className="font-bold text-foreground text-right">{part.brand || <span className="italic text-muted-foreground font-normal">Unknown</span>}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-border/40 pb-3">
                                                <span className="text-muted-foreground font-medium">Part Number</span>
                                                <span className="font-bold text-foreground text-right truncate max-w-[150px]" title={part.part_number || ""}>{part.part_number || <span className="italic text-muted-foreground font-normal">Unknown</span>}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-border/40 pb-3">
                                                <span className="text-muted-foreground font-medium">Est. Price</span>
                                                <span className="font-bold text-emerald-600">{part.estimated_price ? `$${part.estimated_price}` : 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <span className="text-muted-foreground font-medium">Confidence Score</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${confidenceColor}`}>{progressValue}%</span>
                                                    {/* Progress Ring Visual */}
                                                    <div className="relative h-6 w-6 flex items-center justify-center">
                                                        {/* Base track */}
                                                        <svg className="w-6 h-6 transform -rotate-90">
                                                            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="3" fill="transparent" className={progressBgClass} />
                                                            {/* Fill track */}
                                                            <circle
                                                                cx="12" cy="12" r="8"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                                fill="transparent"
                                                                strokeDasharray={circumference}
                                                                strokeDashoffset={strokeDashoffset}
                                                                className={`${progressColorClass} transition-all duration-1000 ease-out`}
                                                                strokeLinecap="round"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-2">
                                        <h3 className="text-lg font-bold font-heading flex items-center gap-2">
                                            <Edit2 className="h-4 w-4 text-primary" />
                                            Notes & Description
                                        </h3>
                                        {!isEditingNotes && (
                                            <Button size="sm" variant="ghost" className="h-7 px-3 text-xs font-semibold rounded-full bg-secondary/50 hover:bg-secondary" onClick={() => setIsEditingNotes(true)}>
                                                Edit
                                            </Button>
                                        )}
                                    </div>

                                    {isEditingNotes ? (
                                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                            <Textarea
                                                className="min-h-[160px] resize-none bg-background focus-visible:ring-primary shadow-sm"
                                                value={notesInput}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotesInput(e.target.value)}
                                                placeholder="Add your own installation notes, links, or custom descriptions here..."
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="sm" onClick={() => { setIsEditingNotes(false); setNotesInput(part.description || "") }} className="rounded-full px-4">
                                                    Cancel
                                                </Button>
                                                <Button size="sm" onClick={handleSaveNotes} disabled={isSavingNotes} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-sm">
                                                    {isSavingNotes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap bg-[#f9fafb] p-5 rounded-2xl border border-border/40 min-h-[160px] shadow-inner font-medium">
                                            {part.description || <span className="text-muted-foreground/60 italic font-normal">No notes or description added yet. Click edit to add your own notes.</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Bottom Amazon Button */}
                <div className="p-4 md:p-6 border-t border-border/40 bg-white/80 backdrop-blur-md shrink-0">
                    <Button
                        asChild
                        size="lg"
                        className="w-full bg-[#FF9900] hover:bg-[#E38900] text-black font-bold border-none rounded-xl h-14 text-base shadow-sm group transition-all"
                    >
                        <a
                            href={addAmazonAffiliateTag(`https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                        >
                            <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            Search &quot;{part.part_name}&quot; on Amazon
                        </a>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
