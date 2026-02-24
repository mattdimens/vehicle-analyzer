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
    }

    // Handle vehicle update in state
    const handleVehicleUpdated = (id: string, updates: Partial<GarageVehicle>) => {
        setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v))
    }

    // Handle part deletion
    const handlePartDeleted = (id: string) => {
        setParts(prev => prev.filter(p => p.id !== id))
    }

    // Handle part update
    const handlePartUpdated = (id: string, updates: Partial<IdentifiedPart>) => {
        setParts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
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
    const showFilters = currentTabLength > 6

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
        <div className="space-y-6">
            {vehicles.length === 0 && parts.length === 0 && (
                <div className="bg-[#003223] text-white p-4 rounded-xl flex items-center gap-3 shadow-md max-w-3xl mx-auto">
                    <div className="bg-white/20 p-2 rounded-full shrink-0">
                        <Sparkles className="h-5 w-5 text-amber-300" />
                    </div>
                    <p className="text-sm font-medium">
                        Welcome to your garage! Save vehicles and parts you identify to build your personal fitment library.
                    </p>
                </div>
            )}

            <Tabs defaultValue="vehicles" className="w-full" onValueChange={setActiveTab}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                        <TabsTrigger value="vehicles" className="flex items-center gap-2">
                            My Vehicles
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EF5A2A] text-[10px] font-bold text-white">
                                {vehicles.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="parts" className="flex items-center gap-2">
                            My Parts
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EF5A2A] text-[10px] font-bold text-white">
                                {parts.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="w-full sm:w-auto">
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-white rounded-xl">
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date-desc">Newest First</SelectItem>
                                <SelectItem value="date-asc">Oldest First</SelectItem>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                {activeTab === "parts" && (
                                    <SelectItem value="category">Category</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {showFilters && (
                    <div className="mb-6 space-y-4 bg-white/50 p-4 rounded-2xl border border-border/40">
                        <Input
                            type="search"
                            placeholder={activeTab === "vehicles" ? "Search vehicles by name, make, model..." : "Search parts by name, brand, part number..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white rounded-xl"
                        />
                        {activeTab === "parts" && uniqueCategories.length > 0 && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                <Button
                                    variant={activeCategoryFilter === null ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setActiveCategoryFilter(null)}
                                    className={`rounded-full whitespace-nowrap ${activeCategoryFilter === null ? 'bg-primary text-primary-foreground' : 'bg-white'}`}
                                >
                                    All Parts
                                </Button>
                                {uniqueCategories.map(cat => (
                                    <Button
                                        key={cat}
                                        variant={activeCategoryFilter === cat ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setActiveCategoryFilter(cat)}
                                        className={`rounded-full whitespace-nowrap ${activeCategoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-white'}`}
                                    >
                                        {cat}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <TabsContent value="vehicles" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                    {vehicles.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border border-border/40 shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                            <div className="h-20 w-20 rounded-full bg-[#E5F1E8] flex items-center justify-center mb-6">
                                <CarFront className="h-10 w-10 text-[#00A95D]" />
                            </div>
                            <h2 className="text-2xl font-bold font-heading mb-4">Your garage is empty</h2>
                            <p className="text-muted-foreground mb-8 max-w-md">
                                Upload a photo of any vehicle to identify it and start tracking compatible parts.
                            </p>
                            <Button asChild size="lg" className="rounded-full px-8 bg-[#EF5A2A] hover:bg-[#D44A20] text-white font-semibold shadow-md border-0">
                                <Link href="/#upload-zone">
                                    Upload Vehicle Photo
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Add New Vehicle Card */}
                            <Link
                                href="/#upload-zone"
                                className="group flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-border/60 bg-white/50 hover:bg-white hover:border-primary/50 transition-all min-h-[300px] cursor-pointer"
                            >
                                <div className="h-16 w-16 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                                    <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    Identify New Vehicle
                                </span>
                            </Link>

                            {/* Vehicle Cards */}
                            {filteredAndSortedVehicles.map((vehicle, index) => (
                                <VehicleCard
                                    key={vehicle.id}
                                    vehicle={vehicle}
                                    index={index}
                                    onDeleted={handleVehicleDeleted}
                                    onUpdated={handleVehicleUpdated}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="parts" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                    {parts.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border border-border/40 shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                            <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
                                <Wrench className="h-10 w-10 text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-bold font-heading mb-4">No parts saved yet</h2>
                            <p className="text-muted-foreground mb-8 max-w-md">
                                Upload a photo of any automotive part to identify it and find where to buy.
                            </p>
                            <Button asChild size="lg" className="rounded-full px-8 bg-[#EF5A2A] hover:bg-[#D44A20] text-white font-semibold shadow-md border-0">
                                <Link href="/part-identifier">
                                    Upload Part Photo
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Add New Part Card */}
                            <Link
                                href="/part-identifier"
                                className="group flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-border/60 bg-white/50 hover:bg-white hover:border-primary/50 transition-all min-h-[300px] cursor-pointer"
                            >
                                <div className="h-16 w-16 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                                    <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    Identify New Part
                                </span>
                            </Link>

                            {/* Part Cards */}
                            {filteredAndSortedParts.map((part, index) => (
                                <PartCard
                                    key={part.id}
                                    part={part}
                                    index={index}
                                    onDeleted={handlePartDeleted}
                                    onUpdated={handlePartUpdated}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
