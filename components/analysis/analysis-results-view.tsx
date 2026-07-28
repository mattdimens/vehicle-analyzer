"use client"

import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { trackEvent } from "@/lib/analytics"
import type {
    AnalysisRecord,
    AnalysisResultData,
    AnalysisDetectedProduct,
} from "@/types/analysis"
import { getConfidenceBand, getConfidenceBandColor, getConfidenceBarColor } from "@/types/analysis"
import { ResultsShellHeader } from "@/components/analysis/results-shell-header"

/**
 * Parse "Product Name (e.g. Example 1, Example 2)" into name + description.
 */
function parseRecommendation(text: string) {
    const match = text.match(/^(.*?)\s*\(([^)]+)\)$/)
    if (match) return { name: match[1].trim(), description: match[2].trim() }
    return { name: text, description: null }
}

interface AnalysisResultsViewProps {
    record: AnalysisRecord
}

export function AnalysisResultsView({ record }: AnalysisResultsViewProps) {
    const resultData = record.result_data
    if (!resultData?.primary) return null

    const { primary, engineDetails, otherPossibilities, recommendedAccessories, tieredRecommendations } = resultData
    const detectedProducts = record.detected_products ?? []

    // Authoritative confidence from primary
    const confidence = primary.confidence
    const band = getConfidenceBand(confidence)
    const bandColor = getConfidenceBandColor(band)

    // Vehicle string for /go links
    const vehicleString = [primary.year, primary.make, primary.model, primary.trim].filter(Boolean).join(' ')

    // Spec line
    const specParts: string[] = []
    if (primary.cabStyle) specParts.push(primary.cabStyle)
    if (primary.bedLength) specParts.push(`${primary.bedLength} bed`)
    if (engineDetails) specParts.push(engineDetails)
    const specLine = specParts.length > 0 ? specParts.join(' · ') : null

    return (
        <div className="space-y-8">
            <ResultsShellHeader />

            {/* ── Primary Identification ──────────────────────────────── */}
            <div className="rounded-2xl border border-border/40 bg-white shadow-sm overflow-hidden p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
                        Primary Identification
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${bandColor}`}>
                            {band} Confidence
                        </span>
                    </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">
                    <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year</div>
                        <div className="text-lg font-semibold text-foreground">{primary.year}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Make</div>
                        <div className="text-lg font-semibold text-foreground">{primary.make}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</div>
                        <div className="text-lg font-semibold text-foreground">{primary.model}</div>
                    </div>
                    {primary.trim && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trim</div>
                            <div className="text-lg font-semibold text-foreground">{primary.trim}</div>
                        </div>
                    )}
                    {primary.cabStyle && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cab Style</div>
                            <div className="text-lg font-semibold text-foreground">{primary.cabStyle}</div>
                        </div>
                    )}
                    {primary.bedLength && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bed Length</div>
                            <div className="text-lg font-semibold text-foreground">{primary.bedLength}</div>
                        </div>
                    )}
                </div>

                {/* Spec line + engine */}
                {specLine && (
                    <div className="mt-6 pt-4 border-t border-border/40">
                        <p className="text-sm text-muted-foreground">{specLine}</p>
                    </div>
                )}
            </div>

            {/* ── Detected Products ───────────────────────────────────── */}
            {detectedProducts.length > 0 && (
                <div className="space-y-4">
                    <h2 className="font-heading text-2xl font-bold">Detected Products</h2>

                    <div className="rounded-2xl border border-border/40 bg-white shadow-sm overflow-hidden">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-muted/30 text-xs font-semibold uppercase text-muted-foreground tracking-wider border-b border-border/40">
                            <div className="col-span-3">Product Type</div>
                            <div className="col-span-2">Brand</div>
                            <div className="col-span-3">Model</div>
                            <div className="col-span-2">Confidence</div>
                            <div className="col-span-2 text-right">Action</div>
                        </div>

                        <div className="divide-y divide-border/40">
                            {detectedProducts.map((item, index) => {
                                const itemBand = getConfidenceBand(item.confidence)
                                const itemBarColor = getConfidenceBarColor(itemBand)
                                const isUnknownBrand = !item.brand || item.brand.toLowerCase().includes("unknown")
                                const isUnknownModel = !item.model || item.model.toLowerCase().includes("unknown")

                                const categorySlug = item.type.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                const brandString = isUnknownBrand ? "" : item.brand
                                const modelString = isUnknownModel ? "" : item.model
                                const redirectUrl = `/go?cat=${encodeURIComponent(categorySlug)}&vehicle=${encodeURIComponent(vehicleString)}&brand=${encodeURIComponent(brandString)}&product=${encodeURIComponent(modelString)}&source=detected-products`

                                return (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 md:px-8 py-4 items-center hover:bg-muted/10 transition-colors">
                                        <div className="col-span-1 md:col-span-3 font-medium text-foreground">
                                            {item.type}
                                        </div>

                                        <div className="col-span-1 md:col-span-2 text-sm text-foreground/80">
                                            <span className="md:hidden text-xs text-muted-foreground mr-2 uppercase">Brand:</span>
                                            {!isUnknownBrand ? item.brand : <span className="text-muted-foreground italic">Unknown</span>}
                                        </div>

                                        <div className="col-span-1 md:col-span-3 text-sm text-foreground/80">
                                            <span className="md:hidden text-xs text-muted-foreground mr-2 uppercase">Model:</span>
                                            {!isUnknownModel ? item.model : <span className="text-muted-foreground italic">Unknown</span>}
                                        </div>

                                        <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                                            <span className="md:hidden text-xs text-muted-foreground uppercase">Confidence:</span>
                                            <div
                                                className="flex-1 md:flex-none h-1.5 w-16 bg-muted rounded-full overflow-hidden"
                                                role="progressbar"
                                                aria-label={`${item.type} confidence: ${itemBand}`}
                                            >
                                                <div className={`h-full rounded-full ${itemBarColor}`} style={{ width: `${item.confidence}%` }} />
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground">{itemBand}</span>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 text-right">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="w-full md:w-auto h-8 px-4 rounded-full hover:bg-[#D1E7F0] border-primary/20"
                                            >
                                                <a
                                                    href={redirectUrl}
                                                    target="_blank"
                                                    rel="nofollow sponsored"
                                                    className="flex items-center justify-center"
                                                    onClick={() => trackEvent('amazon_click', { product: item.type })}
                                                >
                                                    <span className="sr-only">Search on Amazon</span>
                                                    <Image
                                                        src="/amazon-logo.png"
                                                        alt="Amazon"
                                                        width={64}
                                                        height={20}
                                                        className="h-4 w-auto object-contain mt-1"
                                                    />
                                                </a>
                                            </Button>
                                        </div>

                                        {(isUnknownBrand || isUnknownModel) && (
                                            <div className="col-span-1 md:col-start-4 md:col-span-5 text-sm text-muted-foreground italic -mt-2 mb-2">
                                                We detected {item.type.toLowerCase()} on your vehicle but could not identify the exact brand or model
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Recommended Accessories ─────────────────────────────── */}
            {(() => {
                const allRecs = tieredRecommendations?.flatMap(t => t.items) ?? recommendedAccessories ?? []
                if (allRecs.length === 0) return null

                return (
                    <div className="space-y-6">
                        <h2 className="font-heading text-2xl font-bold">
                            Recommended for Your {vehicleString}
                        </h2>

                        {tieredRecommendations && tieredRecommendations.length > 0 ? (
                            <div className="space-y-8">
                                {tieredRecommendations.map((tier, tIdx) => (
                                    <div key={tIdx}>
                                        <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">{tier.title}</h3>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {tier.items.map((accessory, index) => {
                                                const { name, description } = parseRecommendation(accessory)
                                                const categorySlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                                const redirectUrl = `/go?cat=${encodeURIComponent(categorySlug)}&vehicle=${encodeURIComponent(vehicleString)}&product=${encodeURIComponent(name)}&source=recommended-accessories`

                                                return (
                                                    <Card key={index} className="transition-all hover:shadow-md flex flex-col h-full">
                                                        <CardHeader className="flex-1">
                                                            <CardTitle className="text-base mb-2">{name}</CardTitle>
                                                            {description && (
                                                                <p className="text-sm text-muted-foreground mb-4 leading-snug">
                                                                    {description}
                                                                </p>
                                                            )}
                                                        </CardHeader>
                                                        <CardContent className="pt-0 mt-auto">
                                                            <Button asChild variant="outline" size="sm" className="w-full hover:bg-[#D1E7F0]">
                                                                <a
                                                                    href={redirectUrl}
                                                                    target="_blank"
                                                                    rel="nofollow sponsored"
                                                                    className="flex items-center justify-center gap-2"
                                                                    onClick={() => trackEvent('amazon_click', { product: name })}
                                                                >
                                                                    <span className="text-xs font-medium text-muted-foreground">Buy on</span>
                                                                    <Image src="/amazon-logo.png" alt="Amazon" width={80} height={24} className="h-5 w-auto object-contain mt-1" />
                                                                </a>
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {(recommendedAccessories ?? []).map((accessory, index) => {
                                    const { name, description } = parseRecommendation(accessory)
                                    const categorySlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                    const redirectUrl = `/go?cat=${encodeURIComponent(categorySlug)}&vehicle=${encodeURIComponent(vehicleString)}&product=${encodeURIComponent(name)}&source=recommended-accessories`

                                    return (
                                        <Card key={index} className="transition-all hover:shadow-md flex flex-col h-full">
                                            <CardHeader className="flex-1">
                                                <CardTitle className="text-base mb-2">{name}</CardTitle>
                                                {description && (
                                                    <p className="text-sm text-muted-foreground mb-4 leading-snug">
                                                        {description}
                                                    </p>
                                                )}
                                            </CardHeader>
                                            <CardContent className="pt-0 mt-auto">
                                                <Button asChild variant="outline" size="sm" className="w-full hover:bg-[#D1E7F0]">
                                                    <a
                                                        href={redirectUrl}
                                                        target="_blank"
                                                        rel="nofollow sponsored"
                                                        className="flex items-center justify-center gap-2"
                                                        onClick={() => trackEvent('amazon_click', { product: name })}
                                                    >
                                                        <span className="text-xs font-medium text-muted-foreground">Buy on</span>
                                                        <Image src="/amazon-logo.png" alt="Amazon" width={80} height={24} className="h-5 w-auto object-contain mt-1" />
                                                    </a>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })()}

            {/* ── Other Possibilities ─────────────────────────────────── */}
            {otherPossibilities && otherPossibilities.length > 0 && otherPossibilities.some(p => p.vehicle?.trim()) && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Other Possibilities</h3>
                    <div className="rounded-2xl border border-border/40 bg-white shadow-sm overflow-hidden">
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 text-xs font-semibold uppercase text-muted-foreground border-b border-border/40">
                            <div className="col-span-10">Vehicle</div>
                            <div className="col-span-2 text-right">Confidence</div>
                        </div>
                        <div className="divide-y divide-border/40">
                            {otherPossibilities.filter(p => p.vehicle?.trim()).map((item, index) => {
                                const pBand = getConfidenceBand(item.confidence)
                                return (
                                    <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/10 transition-colors">
                                        <div className="col-span-10 font-medium text-foreground">
                                            {item.vehicle}
                                            {item.yearRange && <span className="text-muted-foreground text-sm ml-2">({item.yearRange})</span>}
                                        </div>
                                        <div className="col-span-2 text-right text-xs font-medium text-muted-foreground">{pBand}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
