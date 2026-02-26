"use client"

import { useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabaseClient } from "@/lib/supabase-client"
import { Loader2, Edit2, Check, X, Car, Sparkles, Search } from "lucide-react"
import { toast } from "sonner"
import type { GarageVehicle } from "./garage-dashboard"
import type { DetectedProduct } from "@/app/actions"
import { addAmazonAffiliateTag } from "@/lib/amazon"
import { useMediaQuery } from "@/hooks/use-media-query"

interface VehicleDetailSheetProps {
    isOpen: boolean
    onClose: () => void
    vehicle: GarageVehicle
    onUpdated: (id: string, updates: Partial<GarageVehicle>) => void
}

export function VehicleDetailSheet({ isOpen, onClose, vehicle, onUpdated }: VehicleDetailSheetProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")

    const [isEditingVehicle, setIsEditingVehicle] = useState(false)
    const [nicknameInput, setNicknameInput] = useState(vehicle.nickname || "")
    const [yearInput, setYearInput] = useState(vehicle.year.toString())
    const [makeInput, setMakeInput] = useState(vehicle.make)
    const [modelInput, setModelInput] = useState(vehicle.model)
    const [trimInput, setTrimInput] = useState(vehicle.trim || "")
    const [isSaving, setIsSaving] = useState(false)

    const handleSaveVehicle = async () => {
        setIsSaving(true)
        try {
            const updates = {
                nickname: nicknameInput.trim() || null,
                year: parseInt(yearInput) || vehicle.year,
                make: makeInput.trim() || vehicle.make,
                model: modelInput.trim() || vehicle.model,
                trim: trimInput.trim() || null,
            }

            const { error } = await supabaseClient
                .from("garage_vehicles")
                .update(updates)
                .eq("id", vehicle.id)

            if (error) throw error

            onUpdated(vehicle.id, updates)
            toast.success("Vehicle details updated")
            setIsEditingVehicle(false)
        } catch (error) {
            console.error("Error updating vehicle:", error)
            toast.error("Failed to update vehicle details")
        } finally {
            setIsSaving(false)
        }
    }

    const detectedProducts: DetectedProduct[] = ((vehicle.ai_identification_data as Record<string, unknown> | null)?.detectedProducts as DetectedProduct[]) || []

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side={isDesktop ? "right" : "bottom"} className="max-w-3xl w-full sm:max-w-md md:max-w-xl lg:max-w-2xl p-0 gap-0 overflow-y-auto max-h-[96vh] md:max-h-screen rounded-t-[2rem] md:rounded-t-none md:rounded-l-[2rem]">
                <div className="relative w-full h-56 md:h-72 bg-muted shrink-0 rounded-t-[2rem] md:rounded-t-none md:rounded-tl-[2rem] overflow-hidden">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex items-center gap-3">
                            <SheetTitle className="text-2xl md:text-3xl font-bold font-heading text-white truncate pr-6">
                                {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            </SheetTitle>
                            {!isEditingVehicle && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20 rounded-full shrink-0" onClick={() => setIsEditingVehicle(true)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        {!isEditingVehicle && vehicle.nickname && (
                            <SheetDescription className="text-white/80 font-medium text-sm md:text-base mt-2 flex items-center gap-2">
                                <Car className="h-4 w-4 opacity-70" />
                                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim && vehicle.trim !== "Base" ? vehicle.trim : ""}
                            </SheetDescription>
                        )}
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    {/* Editable Specs Grid */}
                    {isEditingVehicle ? (
                        <div className="space-y-4 bg-muted/30 p-5 rounded-xl border border-border/50 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <Edit2 className="h-4 w-4 text-emerald-600" />
                                    Edit Vehicle Details
                                </h3>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => setIsEditingVehicle(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 shadow-sm" onClick={handleSaveVehicle} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Nickname (Optional)</label>
                                    <Input value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="e.g. My Truck" className="bg-background border-border/60" />
                                </div>
                                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Year</label>
                                    <Input type="number" value={yearInput} onChange={e => setYearInput(e.target.value)} className="bg-background border-border/60" />
                                </div>
                                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Make</label>
                                    <Input value={makeInput} onChange={e => setMakeInput(e.target.value)} className="bg-background border-border/60" />
                                </div>
                                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Model</label>
                                    <Input value={modelInput} onChange={e => setModelInput(e.target.value)} className="bg-background border-border/60" />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Trim</label>
                                    <Input value={trimInput} onChange={e => setTrimInput(e.target.value)} className="bg-background border-border/60" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/20 p-5 rounded-xl border border-border/40 shadow-sm">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Year</p>
                                <p className="font-semibold text-foreground">{vehicle.year}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Make</p>
                                <p className="font-semibold text-foreground">{vehicle.make}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Model</p>
                                <p className="font-semibold text-foreground truncate pr-2" title={vehicle.model}>{vehicle.model}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trim</p>
                                <p className="font-semibold text-foreground truncate pr-2" title={vehicle.trim || "—"}>{vehicle.trim && vehicle.trim !== "Base" ? vehicle.trim : "—"}</p>
                            </div>
                        </div>
                    )}

                    {/* AI Detected Products Section */}
                    {detectedProducts.length > 0 && (
                        <div className="pt-2 pb-6">
                            <h3 className="text-xl font-bold font-heading mb-5 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                AI Detected Products
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        <div key={index} className="group relative flex flex-col justify-between p-5 rounded-xl border border-border/60 bg-white hover:border-amber-300 hover:shadow-md transition-all">
                                            <div>
                                                <div className="flex justify-between items-start gap-4 mb-3">
                                                    <span className="font-bold leading-tight text-foreground">{product.type}</span>
                                                    <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] shrink-0 flex items-center gap-1 shadow-sm">
                                                        {product.confidence}% Match
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3 border border-border/40 space-y-2">
                                                    <div className="flex items-center">
                                                        <span className="font-semibold text-foreground/80 w-16 text-xs uppercase tracking-wider">Brand</span>
                                                        <span className="truncate">{!isUnknownBrand ? product.brand : <span className="italic opacity-60">Unknown</span>}</span>
                                                    </div>
                                                    <div className="h-px w-full bg-border/40" />
                                                    <div className="flex items-center">
                                                        <span className="font-semibold text-foreground/80 w-16 text-xs uppercase tracking-wider">Model</span>
                                                        <span className="truncate">{!isUnknownModel ? product.model : <span className="italic opacity-60">Unknown</span>}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 flex flex-col gap-3">
                                                <div className="text-[11px] text-muted-foreground italic flex items-start gap-1.5 bg-muted/40 p-2 rounded-md border border-border/40">
                                                    <Search className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
                                                    <span className="leading-tight">Searching Amazon for: <span className="font-medium text-foreground/70">"{searchQuery}"</span></span>
                                                </div>
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full h-10 rounded-lg hover:bg-[#D1E7F0] hover:text-[#003223] border-primary/20 text-sm font-semibold transition-colors shadow-sm"
                                                >
                                                    <a
                                                        href={addAmazonAffiliateTag(`https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2"
                                                    >
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
            </SheetContent>
        </Sheet>
    )
}
