"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabaseClient } from "@/lib/supabase-client"
import { Loader2, Trash2, ExternalLink, Edit2, Check, X, Car } from "lucide-react"
import { toast } from "sonner"
import type { GarageVehicle } from "./garage-dashboard"

interface SavedPart {
    id: string
    created_at: string
    vehicle_id: string
    part_type: string
    part_name: string
    brand: string | null
    part_number: string | null
    estimated_price: number | null
    affiliate_url: string | null
    part_category: string
}

interface VehicleDetailSheetProps {
    isOpen: boolean
    onClose: () => void
    vehicle: GarageVehicle
    onUpdated: (id: string, updates: Partial<GarageVehicle>) => void
}

export function VehicleDetailSheet({ isOpen, onClose, vehicle, onUpdated }: VehicleDetailSheetProps) {
    const [parts, setParts] = useState<SavedPart[]>([])
    const [isLoadingParts, setIsLoadingParts] = useState(true)

    const [isEditingNickname, setIsEditingNickname] = useState(false)
    const [nicknameInput, setNicknameInput] = useState(vehicle.nickname || "")
    const [isSavingNickname, setIsSavingNickname] = useState(false)

    // Fetch parts when modal opens
    useEffect(() => {
        if (!isOpen) return

        const fetchParts = async () => {
            setIsLoadingParts(true)
            try {
                const { data, error } = await supabaseClient
                    .from("saved_parts")
                    .select("*")
                    .eq("vehicle_id", vehicle.id)
                    .order("created_at", { ascending: false })

                if (error) throw error
                if (data) setParts(data as SavedPart[])
            } catch (error) {
                console.error("Error fetching parts:", error)
                toast.error("Failed to load saved parts")
            } finally {
                setIsLoadingParts(false)
            }
        }

        fetchParts()
    }, [isOpen, vehicle.id])

    const handleSaveNickname = async () => {
        const newNickname = nicknameInput.trim() || null
        if (newNickname === vehicle.nickname) {
            setIsEditingNickname(false)
            return
        }

        setIsSavingNickname(true)
        try {
            const { error } = await supabaseClient
                .from("garage_vehicles")
                .update({ nickname: newNickname })
                .eq("id", vehicle.id)

            if (error) throw error

            onUpdated(vehicle.id, { nickname: newNickname })
            toast.success("Vehicle nickname updated")
            setIsEditingNickname(false)
        } catch (error) {
            console.error("Error updating nickname:", error)
            toast.error("Failed to update nickname")
        } finally {
            setIsSavingNickname(false)
        }
    }

    const handleDeletePart = async (partId: string) => {
        if (!confirm("Remove this part from your garage?")) return

        try {
            const { error } = await supabaseClient
                .from("saved_parts")
                .delete()
                .eq("id", partId)

            if (error) throw error

            setParts(prev => prev.filter(p => p.id !== partId))
            toast.success("Part removed")

            // Note: Currently we don't sync the count back to the dashboard state 
            // since it requires a fresh join, but the user will see it on refresh.
        } catch (error) {
            console.error("Error removing part:", error)
            toast.error("Failed to remove part")
        }
    }

    // Group parts by category
    const partsByCategory = parts.reduce((acc, part) => {
        const cat = part.part_category || "Other"
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(part)
        return acc
    }, {} as Record<string, SavedPart[]>)

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <div className="relative w-full h-48 md:h-64 bg-muted shrink-0">
                    {vehicle.photo_url ? (
                        <img
                            src={vehicle.photo_url}
                            alt="Vehicle"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                            <Car className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute bottom-4 left-6 right-6">
                        {isEditingNickname ? (
                            <div className="flex items-center gap-2 max-w-sm">
                                <Input
                                    className="bg-white/90 text-black placeholder:text-gray-500 h-9"
                                    value={nicknameInput}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNicknameInput(e.target.value)}
                                    placeholder="Enter a nickname..."
                                    autoFocus
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSaveNickname()}
                                />
                                <Button size="icon" className="h-9 w-9 shrink-0 bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveNickname} disabled={isSavingNickname}>
                                    {isSavingNickname ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <Button size="icon" variant="secondary" className="h-9 w-9 shrink-0" onClick={() => { setIsEditingNickname(false); setNicknameInput(vehicle.nickname || "") }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-2xl md:text-3xl font-bold font-heading text-white">
                                    {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                </DialogTitle>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20 rounded-full" onClick={() => setIsEditingNickname(true)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {!isEditingNickname && vehicle.nickname && (
                            <DialogDescription className="text-white/80 font-medium text-sm md:text-base mt-1">
                                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim && vehicle.trim !== "Base" ? vehicle.trim : ""}
                            </DialogDescription>
                        )}
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <h3 className="text-lg font-bold font-heading mb-6 border-b pb-2">Saved Parts</h3>

                    {isLoadingParts ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : parts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl border-border/60">
                            <p>No parts saved for this vehicle yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(partsByCategory).map(([category, categoryParts]) => (
                                <div key={category} className="space-y-3">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{category.replace(/_/g, " ")}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {categoryParts.map((part) => (
                                            <div key={part.id} className="group relative flex flex-col justify-between p-4 rounded-xl border border-border/40 bg-muted/20 hover:bg-white hover:shadow-sm hover:border-border/80 transition-all">
                                                <div>
                                                    <div className="flex justify-between items-start gap-4">
                                                        <span className="font-semibold leading-tight text-foreground/90">{part.part_name}</span>
                                                        {part.estimated_price && (
                                                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-sm shrink-0">
                                                                ${part.estimated_price}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {part.brand && (
                                                        <span className="text-sm text-muted-foreground mt-1 block">Brand: {part.brand}</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                                                    {part.affiliate_url && (
                                                        <a
                                                            href={part.affiliate_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-semibold text-primary flex items-center gap-1.5 hover:text-primary/80 transition-colors"
                                                        >
                                                            View Product
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground/60 hover:text-red-600 hover:bg-red-50 h-8 px-2 -mr-2 ml-auto"
                                                        onClick={() => handleDeletePart(part.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
