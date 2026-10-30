
"use client"

import Link from "next/link"
import { ArrowRight, Disc, Truck, Layers } from "lucide-react"
import { supportedVehicles } from "@/data/vehicles/supported-vehicles"
import { cardClass, mutedTextClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

const categoryCardClass = cn(cardClass, "group flex flex-col p-6 transition-colors hover:border-[#17212B]")
const categoryIconClass =
    "mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#FDF0E9] text-[#9A3412] transition-colors group-hover:bg-[#C8460F] group-hover:text-white"

export function ProductCategories() {
    const flagship = supportedVehicles[0]
    const flagshipGen = flagship.generations[0]
    const shopBaseUrl = `${flagship.routeBase}/${flagshipGen.slug}`
    return (
        <section id="product-categories" className="scroll-mt-14 w-full py-16 md:py-20">
            <div className="container max-w-6xl">
                <div className="mb-16 text-center">
                    <h2 className="font-heading text-4xl font-bold text-[#17212B] md:text-5xl">
                        Specialized <span className="text-primary italic">Category Analysis</span>
                    </h2>
                    <p className={cn("mt-4 text-lg max-w-2xl mx-auto", mutedTextClass)}>
                        Our category analyzers use analysis tailored to specific accessory types, so you get deeper fitment details, more accurate matches, and better product recommendations than a general analysis.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Wheels & Rims */}
                    <div className={categoryCardClass}>
                        <Link href="/wheels-rims" className="flex-1">
                            <div className={categoryIconClass}>
                                <Disc className="h-7 w-7" />
                            </div>
                            <h3 className="mb-2 font-heading text-xl font-semibold text-[#17212B]">Wheels & Rims</h3>
                            <p className={cn("mb-3", mutedTextClass)}>
                                Our wheel-specific analysis identifies exact fitment specs, including bolt pattern, offset, diameter, and tire size, so every match is compatible. Find the perfect wheel and tire package for your vehicle.
                            </p>
                            <p className={cn("mb-6 text-xs", mutedTextClass)}>
                                Read our <span className="text-primary underline underline-offset-2">wheel fitment guide covering bolt pattern, offset, and rim sizing</span>
                            </p>
                        </Link>
                        <div className="flex items-center gap-6 pt-4 mt-auto border-t border-[#E4EBF0]">
                            <Link href="/wheels-rims" className="flex items-center text-sm font-medium text-primary hover:translate-x-1 transition-transform">
                                Analyze Wheels <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Link>
                            <Link href={`${shopBaseUrl}/#cat-wheels-tires`} className="flex items-center text-sm font-medium text-primary hover:translate-x-1 transition-transform">
                                Shop picks <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Truck Bed Covers */}
                    <div className={categoryCardClass}>
                        <Link href="/truck-bed-covers" className="flex-1">
                            <div className={categoryIconClass}>
                                <Truck className="h-7 w-7" />
                            </div>
                            <h3 className="mb-2 font-heading text-xl font-semibold text-[#17212B]">Truck Bed Covers</h3>
                            <p className={cn("mb-3", mutedTextClass)}>
                                Tailored analysis determines your exact bed length and cab configuration to match you with the right tonneau cover or bed liner, with no guessing on fitment.
                            </p>
                            <p className={cn("mb-6 text-xs", mutedTextClass)}>
                                Read our <span className="text-primary underline underline-offset-2">bed cover guide comparing tri-fold, roll-up, and retractable styles</span>
                            </p>
                        </Link>
                        <div className="flex items-center gap-6 pt-4 mt-auto border-t border-[#E4EBF0]">
                            <Link href="/truck-bed-covers" className="flex items-center text-sm font-medium text-primary hover:translate-x-1 transition-transform">
                                Analyze Covers <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Link>
                            <Link href={`${shopBaseUrl}/#cat-bed`} className="flex items-center text-sm font-medium text-primary hover:translate-x-1 transition-transform">
                                Shop picks <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Running Boards */}
                    <div className={categoryCardClass}>
                        <Link href="/nerf-bars-running-boards" className="flex-1">
                            <div className={categoryIconClass}>
                                <Layers className="h-7 w-7" />
                            </div>
                            <h3 className="mb-2 font-heading text-xl font-semibold text-[#17212B]">Running Boards</h3>
                            <p className={cn("mb-3", mutedTextClass)}>
                                Purpose-built analysis verifies cab size, door count, and mounting points to ensure exact compatibility for nerf bars, side steps, and rock sliders.
                            </p>
                            <p className={cn("mb-6 text-xs", mutedTextClass)}>
                                Read our <span className="text-primary underline underline-offset-2">running board guide on cab fit, mounting types, and materials</span>
                            </p>
                        </Link>
                        <div className="flex items-center gap-6 pt-4 mt-auto border-t border-[#E4EBF0]">
                            <Link href="/nerf-bars-running-boards" className="flex items-center text-sm font-medium text-primary hover:translate-x-1 transition-transform">
                                Analyze Boards <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Link>
                            <Link href={`${shopBaseUrl}/#cat-exterior`} className="flex items-center text-sm font-medium text-primary hover:translate-x-1 transition-transform">
                                Shop picks <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
