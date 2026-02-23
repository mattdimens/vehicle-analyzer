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
import { Loader2, Edit2, Check, X, Car, Sparkles, Search } from "lucide-react"
import { toast } from "sonner"
import type { GarageVehicle } from "./garage-dashboard"
import type { DetectedProduct } from "@/app/actions"
import { addAmazonAffiliateTag } from "@/lib/amazon"

interface VehicleDetailSheetProps {
    isOpen: boolean
    onClose: () => void
    vehicle: GarageVehicle
    onUpdated: (id: string, updates: Partial<GarageVehicle>) => void
}

export function VehicleDetailSheet({ isOpen, onClose, vehicle, onUpdated }: VehicleDetailSheetProps) {
    const [isEditingNickname, setIsEditingNickname] = useState(false)
    const [nicknameInput, setNicknameInput] = useState(vehicle.nickname || "")
    const [isSavingNickname, setIsSavingNickname] = useState(false)

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

    const detectedProducts: DetectedProduct[] = (vehicle.ai_identification_data?.detectedProducts as DetectedProduct[]) || []

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
                    {/* AI Detected Products Section */}
                    {detectedProducts.length > 0 && (
                        <div className="mt-12">
                            <h3 className="text-lg font-bold font-heading mb-6 border-b pb-2 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                AI Detected Products
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {detectedProducts.map((product, index) => {
                                    const isUnknownBrand = !product.brand || product.brand.toLowerCase().includes("unknown")
                                    const isUnknownModel = !product.model || product.model.toLowerCase().includes("unknown")

                                    const vehicleDetails = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                                    let searchQuery = ""
                                    if (isUnknownBrand || isUnknownModel) {
                                        searchQuery = `${vehicleDetails} ${product.type}`
                                    } else {
                                        searchQuery = `${vehicleDetails} ${product.brand} ${product.model}`
                                    }

                                    return (
                                        <div key={index} className="group relative flex flex-col justify-between p-4 rounded-xl border border-amber-200/50 bg-amber-50/30 hover:bg-white hover:shadow-sm hover:border-amber-300 transition-all">
                                            <div>
                                                <div className="flex justify-between items-start gap-4">
                                                    <span className="font-semibold leading-tight text-foreground/90">{product.type}</span>
                                                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs shrink-0 flex items-center gap-1">
                                                        {product.confidence}% Match
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                                    <div><span className="font-medium text-foreground/70">Brand:</span> {!isUnknownBrand ? product.brand : <span className="italic">Unknown</span>}</div>
                                                    <div><span className="font-medium text-foreground/70">Model:</span> {!isUnknownModel ? product.model : <span className="italic">Unknown</span>}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end mt-4 pt-4 border-t border-amber-100">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full h-8 px-4 rounded-full hover:bg-[#D1E7F0] border-primary/20 text-xs"
                                                >
                                                    <a
                                                        href={addAmazonAffiliateTag(`https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2"
                                                    >
                                                        <Search className="h-3 w-3" />
                                                        Search on Amazon
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
