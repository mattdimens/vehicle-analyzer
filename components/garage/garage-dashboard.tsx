"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase-client"
import { Loader2, Plus, CarFront } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    saved_parts: [{ count: number }]
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
                    .select("*, saved_parts(count)")
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

    if (vehicles.length === 0 && parts.length === 0) {
        return (
            <div className="bg-white rounded-[2rem] border border-border/40 shadow-sm p-8 md:p-16 flex flex-col items-center justify-center text-center">
                <div className="flex gap-4 mb-6">
                    <div className="h-20 w-20 rounded-full bg-[#E5F1E8] flex items-center justify-center">
                        <CarFront className="h-10 w-10 text-[#00A95D]" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold font-heading mb-2">Your garage is empty</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                    Upload a photo of your car, truck, or SUV to identify it, or upload a photo of a specific part to figure out what it is!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild size="lg" className="rounded-full px-8">
                        <Link href="/#upload-zone">
                            <Plus className="mr-2 h-4 w-4" />
                            Identify a Vehicle
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                        <Link href="/part-identifier">
                            <Plus className="mr-2 h-4 w-4" />
                            Identify a Part
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Tabs defaultValue="vehicles" className="w-full">
            <div className="flex justify-between items-center mb-6">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="vehicles">My Vehicles ({vehicles.length})</TabsTrigger>
                    <TabsTrigger value="parts">My Parts ({parts.length})</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="vehicles" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                {vehicles.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-border/40 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                        <h2 className="text-xl font-bold font-heading mb-2">No vehicles saved yet</h2>
                        <Button asChild size="lg" className="rounded-full mt-4">
                            <Link href="/#upload-zone">
                                Identify a Vehicle
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        {vehicles.map((vehicle) => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onDeleted={handleVehicleDeleted}
                                onUpdated={handleVehicleUpdated}
                            />
                        ))}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="parts" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                {parts.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-border/40 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                        <h2 className="text-xl font-bold font-heading mb-2">No parts saved yet</h2>
                        <Button asChild size="lg" className="rounded-full mt-4">
                            <Link href="/part-identifier">
                                Identify a Part
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        {parts.map((part) => (
                            <PartCard
                                key={part.id}
                                part={part}
                                onDeleted={handlePartDeleted}
                                onUpdated={handlePartUpdated}
                            />
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
}
