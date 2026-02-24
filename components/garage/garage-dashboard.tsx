"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase-client"
import { Loader2, Plus, CarFront, Wrench, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { VehicleCard } from "./vehicle-card"
import { PartCard } from "./part-card"
import { ResultsDisplay } from "../home/results-display"

// Define a type for our vehicle with the joined count
export type GarageVehicle = {
    id: string
    created_at: string
    year: number
    make: string
    model: string
    trim: string | null
    nickname: string | null
    photo_url: string | null
    ai_identification_data: Record<string, unknown>
}

export type IdentifiedPart = {
    id: string
    created_at: string
    part_name: string
    part_category: string
    brand: string | null
    part_number: string | null
    estimated_price: number | null
    affiliate_url: string | null
    description: string | null
    confidence: number | null
    vehicle_year: string | null
    vehicle_make: string | null
    vehicle_model: string | null
    vehicle_trim: string | null
    photo_url: string | null
    ai_identification_data: Record<string, unknown>
}

export function GarageDashboard() {
    const { session, signInWithGoogle } = useAuth()
    const router = useRouter()

    const [vehicles, setVehicles] = useState<GarageVehicle[]>([])
    const [parts, setParts] = useState<IdentifiedPart[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthChecking, setIsAuthChecking] = useState(true)

    // Filter & Sort State
    const [activeTab, setActiveTab] = useState("vehicles")
    const [searchQuery, setSearchQuery] = useState("")
    const [sortOrder, setSortOrder] = useState("date-desc")
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null)

    // Selection State for Master-Detail
    const [selectedVehicle, setSelectedVehicle] = useState<GarageVehicle | null>(null)
    const [selectedPart, setSelectedPart] = useState<IdentifiedPart | null>(null)

    // Auth protection layer
    useEffect(() => {
        // Give the auth provider a tiny bit of time to initialize
        // If no session after a short delay, redirect
        const timer = setTimeout(() => {
            setIsAuthChecking(false)
            if (!session) {
                router.push("/")
                // Optionally trigger sign in
                setTimeout(() => signInWithGoogle(), 100)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [session, router, signInWithGoogle])

    // Data fetching
    useEffect(() => {
        if (!session) return

        const fetchVehicles = async () => {
            setIsLoading(true)
            try {
                // Fetch vehicles and get the count of associated saved parts
                const vehiclesPromise = supabaseClient
                    .from("garage_vehicles")
                    .select("*")
                    .order("created_at", { ascending: false })

                // Fetch identified parts
                const partsPromise = supabaseClient
                    .from("identified_parts")
                    .select("*")
                    .order("created_at", { ascending: false })

                const [vehiclesResult, partsResult] = await Promise.all([vehiclesPromise, partsPromise])

                if (vehiclesResult.error) throw vehiclesResult.error
                if (partsResult.error) throw partsResult.error

                if (vehiclesResult.data) {
                    setVehicles(vehiclesResult.data as unknown as GarageVehicle[])
                }
                if (partsResult.data) {
                    setParts(partsResult.data as IdentifiedPart[])
                }
            } catch (error) {
                console.error("Error fetching vehicles:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchVehicles()
    }, [session])

    // Handle vehicle deletion from state
    const handleVehicleDeleted = (id: string) => {
        setVehicles(prev => prev.filter(v => v.id !== id))
        if (selectedVehicle?.id === id) setSelectedVehicle(null)
    }

    // Handle vehicle update in state
    const handleVehicleUpdated = (id: string, updates: Partial<GarageVehicle>) => {
        setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v))
        if (selectedVehicle?.id === id) {
            setSelectedVehicle(prev => prev ? { ...prev, ...updates } : null)
        }
    }

    // Handle part deletion
    const handlePartDeleted = (id: string) => {
        setParts(prev => prev.filter(p => p.id !== id))
        if (selectedPart?.id === id) setSelectedPart(null)
    }

    // Handle part update
    const handlePartUpdated = (id: string, updates: Partial<IdentifiedPart>) => {
        setParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
        if (selectedPart?.id === id) {
            setSelectedPart(prev => prev ? { ...prev, ...updates } : null)
        }
    }

    // Derived State: Filtering and Sorting
    const filteredAndSortedVehicles = [...vehicles]
        .filter(v => {
            if (!searchQuery) return true
            const q = searchQuery.toLowerCase()
            return (
                (v.nickname?.toLowerCase().includes(q)) ||
                (v.make?.toLowerCase().includes(q)) ||
                (v.model?.toLowerCase().includes(q))
            )
        })
        .sort((a, b) => {
            if (sortOrder === "date-desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            if (sortOrder === "date-asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            if (sortOrder === "name-asc" || sortOrder === "name-desc") {
                const nameA = a.nickname || `${a.year} ${a.make} ${a.model}`
                const nameB = b.nickname || `${b.year} ${b.make} ${b.model}`
                return sortOrder === "name-asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
            }
            return 0
        })

    const filteredAndSortedParts = [...parts]
        .filter(p => {
            if (activeCategoryFilter && p.part_category !== activeCategoryFilter) return false
            if (!searchQuery) return true
            const q = searchQuery.toLowerCase()
            return (
                (p.part_name?.toLowerCase().includes(q)) ||
                (p.brand?.toLowerCase().includes(q)) ||
                (p.part_number?.toLowerCase().includes(q))
            )
        })
        .sort((a, b) => {
            if (sortOrder === "date-desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            if (sortOrder === "date-asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            if (sortOrder === "name-asc") return a.part_name.localeCompare(b.part_name)
            if (sortOrder === "name-desc") return b.part_name.localeCompare(a.part_name)
            if (sortOrder === "category") return (a.part_category || "").localeCompare(b.part_category || "")
            return 0
        })

    const uniqueCategories = Array.from(new Set(parts.map(p => p.part_category))).filter(Boolean) as string[]
    const currentTabLength = activeTab === "vehicles" ? vehicles.length : parts.length
    const showFilters = currentTabLength > 0 // Always show filters in sidebar if there are items

    if (isAuthChecking || (!session && !isAuthChecking)) {
        return (
            <div className="flex flex-col items-center justify-center py-24 min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Authenticating securely...</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading your garage...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-theme(spacing.16))] w-full max-w-[1600px] mx-auto bg-gray-50/50">
            {/* Sidebar (List View) */}
            <div className={`
                w-full md:w-[380px] shrink-0 border-r border-border/40 bg-white flex flex-col h-full
                ${(selectedVehicle || selectedPart) ? 'hidden md:flex' : 'flex'}
            `}>
                <div className="p-4 border-b border-border/40">
                    <Tabs defaultValue="vehicles" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="vehicles" className="flex items-center gap-2">
                                <CarFront className="h-4 w-4" />
                                Vehicles
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EF5A2A] text-[10px] font-bold text-white ml-auto">
                                    {vehicles.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="parts" className="flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Parts
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EF5A2A] text-[10px] font-bold text-white ml-auto">
                                    {parts.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        {showFilters && (
                            <div className="space-y-3">
                                <Input
                                    type="search"
                                    placeholder={activeTab === "vehicles" ? "Search vehicles..." : "Search parts..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 bg-gray-50 border-border/50 text-sm"
                                />
                                {activeTab === "parts" && uniqueCategories.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        <Button
                                            variant={activeCategoryFilter === null ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setActiveCategoryFilter(null)}
                                            className={`h-7 px-3 text-xs rounded-full whitespace-nowrap ${activeCategoryFilter === null ? 'bg-primary text-primary-foreground' : 'bg-gray-50'}`}
                                        >
                                            All
                                        </Button>
                                        {uniqueCategories.map(cat => (
                                            <Button
                                                key={cat}
                                                variant={activeCategoryFilter === cat ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setActiveCategoryFilter(cat)}
                                                className={`h-7 px-3 text-xs rounded-full whitespace-nowrap ${activeCategoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-gray-50'}`}
                                            >
                                                {cat}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Tabs>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
                    {activeTab === "vehicles" ? (
                        vehicles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-70">
                                <CarFront className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                                <p className="text-sm font-medium text-foreground">No vehicles saved</p>
                                <p className="text-xs text-muted-foreground mt-1">Upload a photo to see it here.</p>
                            </div>
                        ) : (
                            filteredAndSortedVehicles.map((vehicle, index) => (
                                <VehicleCard
                                    key={vehicle.id}
                                    vehicle={vehicle}
                                    index={index}
                                    isActive={selectedVehicle?.id === vehicle.id}
                                    onClick={(v) => { setSelectedVehicle(v); setSelectedPart(null); }}
                                    onDeleted={handleVehicleDeleted}
                                />
                            ))
                        )
                    ) : (
                        parts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-70">
                                <Wrench className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                                <p className="text-sm font-medium text-foreground">No parts saved</p>
                                <p className="text-xs text-muted-foreground mt-1">Upload a part photo to see it here.</p>
                            </div>
                        ) : (
                            filteredAndSortedParts.map((part, index) => (
                                <PartCard
                                    key={part.id}
                                    part={part}
                                    index={index}
                                    isActive={selectedPart?.id === part.id}
                                    onClick={(p) => { setSelectedPart(p); setSelectedVehicle(null); }}
                                    onDeleted={handlePartDeleted}
                                />
                            ))
                        )
                    )}
                </div>

                {/* Fixed Run New Analysis Button at Bottom of Sidebar */}
                <div className="p-4 border-t border-border/40 bg-gray-50/80 backdrop-blur-sm z-10">
                    <Button asChild className="w-full bg-[#EF5A2A] hover:bg-[#D44A20] shadow-sm rounded-xl h-11">
                        <Link href={activeTab === "vehicles" ? "/#upload-zone" : "/part-identifier"}>
                            <Plus className="mr-2 h-4 w-4" />
                            Identify New {activeTab === "vehicles" ? "Vehicle" : "Part"}
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Main Area (Detail View) */}
            <div className={`
                flex-1 flex flex-col h-full bg-gray-50/50 relative
                ${!(selectedVehicle || selectedPart) ? 'hidden md:flex' : 'flex'}
            `}>
                {selectedVehicle ? (
                    <div className="h-full overflow-y-auto">
                        {/* Mobile Back Button */}
                        <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-border/40 px-4 py-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedVehicle(null)}
                                className="pl-0 hover:bg-transparent"
                            >
                                ← Back to list
                            </Button>
                        </div>
                        <ResultsDisplay
                            analysisMode="vehicle"
                            results={selectedVehicle.ai_identification_data as any}
                            detectedProducts={selectedVehicle.ai_identification_data.detectedProducts as any[]}
                            loadingMessage={null}
                            progress={100}
                            imageUrls={selectedVehicle.photo_url ? [selectedVehicle.photo_url] : []}
                            isSavedToGarage={true} // Need to pass these so it knows it is saved
                            hideSaveActions={true} // Adjust as needed based on ResultsDisplay API
                        />
                    </div>
                ) : selectedPart ? (
                    <div className="h-full overflow-y-auto">
                        {/* Mobile Back Button */}
                        <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-border/40 px-4 py-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedPart(null)}
                                className="pl-0 hover:bg-transparent"
                            >
                                ← Back to list
                            </Button>
                        </div>
                        <ResultsDisplay
                            analysisMode="part"
                            partIdentification={selectedPart.ai_identification_data as any}
                            loadingMessage={null}
                            progress={100}
                            imageUrls={selectedPart.photo_url ? [selectedPart.photo_url] : []}
                            isSavedToParts={true}
                            hideSaveActions={true}
                        />
                    </div>
                ) : (
                    // Empty State Main Area Template
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-border/40 max-w-sm w-full mx-auto relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold font-heading mb-2">Select an item</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                Choose a vehicle or part from the sidebar to view its complete identification report and analysis details.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
