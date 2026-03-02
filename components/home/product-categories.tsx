
"use client"

import Link from "next/link"
import { ArrowRight, Disc, Truck, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProductCategories() {
    return (
        <section id="product-categories" className="w-full bg-white py-16 md:py-20">
            <div className="container max-w-6xl">
                <div className="mb-16 text-center">
                    <h2 className="font-heading text-4xl font-bold text-black md:text-5xl">
                        Specialized <span className="text-primary italic">Category Analysis</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Our category analyzers use AI prompts tailored to specific accessory types, so you get deeper fitment details, more accurate matches, and better product recommendations than a general analysis.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Wheels & Rims */}
                    <Link href="/wheels-rims" className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Disc className="h-7 w-7" />
                        </div>
                        <h3 className="mb-2 font-heading text-xl font-semibold">Wheels & Rims</h3>
                        <p className="mb-3 flex-1 text-muted-foreground">
                            Our wheel-specific AI identifies exact fitment specs, including bolt pattern, offset, diameter, and tire size, so every match is compatible. Find the perfect wheel and tire package for your vehicle.
                        </p>
                        <p className="mb-6 text-xs text-muted-foreground/70">
                            Read our <span className="text-primary underline underline-offset-2">wheel fitment guide covering bolt pattern, offset, and rim sizing</span>
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
                        <p className="mb-3 flex-1 text-muted-foreground">
                            Tailored AI analysis determines your exact bed length and cab configuration to match you with the right tonneau cover or bed liner, with no guessing on fitment.
                        </p>
                        <p className="mb-6 text-xs text-muted-foreground/70">
                            Read our <span className="text-primary underline underline-offset-2">bed cover guide comparing tri-fold, roll-up, and retractable styles</span>
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
                        <p className="mb-3 flex-1 text-muted-foreground">
                            Purpose-built analysis verifies cab size, door count, and mounting points to ensure exact compatibility for nerf bars, side steps, and rock sliders.
                        </p>
                        <p className="mb-6 text-xs text-muted-foreground/70">
                            Read our <span className="text-primary underline underline-offset-2">running board guide on cab fit, mounting types, and materials</span>
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
