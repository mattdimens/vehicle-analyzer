
"use client"

import Link from "next/link"
import { ArrowRight, Disc, Truck, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProductCategories() {
    return (
        <section id="product-categories" className="w-full bg-[#F5EBE1] py-24">
            <div className="container max-w-6xl">
                <div className="mb-16 text-center">
                    <h2 className="font-heading text-4xl font-bold text-black md:text-5xl">
                        Analysis by <span className="text-primary italic">Product Category</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Select a specific category for specialized AI analysis and tailored recommendations.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Wheels & Rims */}
                    <Link href="/wheels-rims" className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Disc className="h-7 w-7" />
                        </div>
                        <h3 className="mb-2 font-heading text-xl font-semibold">Wheels & Rims</h3>
                        <p className="mb-6 flex-1 text-muted-foreground">
                            Identify fitment, bolt patterns, and offsets. Find the perfect wheel and tire package for your vehicle.
                        </p>
                        <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                            Analyze Wheels <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </Link>

                    {/* Truck Bed Covers */}
                    <Link href="/truck-bed-covers" className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <Truck className="h-7 w-7" />
                        </div>
                        <h3 className="mb-2 font-heading text-xl font-semibold">Truck Bed Covers</h3>
                        <p className="mb-6 flex-1 text-muted-foreground">
                            Determine bed length and cabin style to match with the correct tonneau cover or bed liner.
                        </p>
                        <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                            Analyze Bed Covers <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </Link>

                    {/* Running Boards */}
                    <Link href="/nerf-bars-running-boards" className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <Layers className="h-7 w-7" />
                        </div>
                        <h3 className="mb-2 font-heading text-xl font-semibold">Running Boards</h3>
                        <p className="mb-6 flex-1 text-muted-foreground">
                            Verify cab size and mounting compatibility for nerf bars, side steps, and rock sliders.
                        </p>
                        <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                            Analyze Running Boards <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    )
}
