import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { sampleAnalysisRecord } from "@/data/sample-analysis"
import { getConfidenceBand, getConfidenceBandColor, getConfidenceBarColor } from "@/types/analysis"

/**
 * Parse "Product Name (e.g. Example 1, Example 2)" into name + description.
 */
function parseRecommendation(text: string) {
    const match = text.match(/^(.*?)\s*\(([^)]+)\)$/)
    if (match) return { name: match[1].trim(), description: match[2].trim() }
    return { name: text, description: null }
}

export function SampleResultPreview() {
    const record = sampleAnalysisRecord
    const primary = record.result_data?.primary

    if (!primary) return null

    // Authoritative confidence from primary
    const confidence = primary.confidence
    const band = getConfidenceBand(confidence)
    const bandColor = getConfidenceBandColor(band)

    const detectedProducts = record.detected_products ?? []
    
    // Sort products by confidence desc, cap at 4 for the preview
    const sortedProducts = [...detectedProducts].sort((a, b) => b.confidence - a.confidence)
    const previewProducts = sortedProducts.slice(0, 4)
    const remainingProductCount = sortedProducts.length - 4

    // Prepare capped recommendations for preview (top 3)
    const allRecs = record.result_data?.tieredRecommendations?.flatMap(t => t.items) ?? record.result_data?.recommendedAccessories ?? []
    const previewRecs = allRecs.slice(0, 3)
    const remainingRecCount = allRecs.length - 3

    // Spec line
    const specParts: string[] = []
    if (primary.cabStyle) specParts.push(primary.cabStyle)
    if (primary.bedLength) specParts.push(`${primary.bedLength} bed`)
    if (record.result_data?.engineDetails) specParts.push(record.result_data.engineDetails)
    const specLine = specParts.length > 0 ? specParts.join(' · ') : null

    const vehicleString = [primary.year, primary.make, primary.model, primary.trim].filter(Boolean).join(' ')

    return (
        <div
            id="sample-result-preview"
            className="w-full max-w-5xl mx-auto px-4 pb-4"
        >
            {/* Eyebrow label directly on hero background */}
            <p className="text-white/60 text-xs font-medium tracking-wide mb-2 uppercase text-center md:text-left">
                Sample result
            </p>

            {/* Light inner card replacing outer wrapper */}
            <div className="bg-[#FCFBF7] rounded-xl p-3 shadow-lg border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
                    {/* Left column: sample image */}
                    <div>
                        <Image
                            src={record.image_url}
                            alt="Sample analysis vehicle"
                            width={460}
                            height={300}
                            className="rounded-lg object-cover w-full h-[120px]"
                        />
                        <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                            Example analysis from a single uploaded photo
                        </p>
                    </div>

                    {/* Right column: compact results preview */}
                    <div className="min-w-0 flex flex-col gap-4">
                        
                        {/* Primary Identification */}
                        <div className="flex flex-col text-left">
                            <div className="rounded-xl border border-border/40 bg-white shadow-sm overflow-hidden p-3 md:p-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2">
                                    <p className="text-base font-semibold flex items-center gap-2">
                                        Primary Identification
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${bandColor}`}>
                                            {band} Confidence
                                        </span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year</div>
                                        <div className="text-sm font-semibold text-foreground">{primary.year}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Make</div>
                                        <div className="text-sm font-semibold text-foreground">{primary.make}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</div>
                                        <div className="text-sm font-semibold text-foreground">{primary.model}</div>
                                    </div>
                                    {primary.trim && (
                                        <div className="space-y-1">
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trim</div>
                                            <div className="text-sm font-semibold text-foreground">{primary.trim}</div>
                                        </div>
                                    )}
                                </div>

                                {specLine && (
                                    <p className="mt-2 text-xs text-muted-foreground">{specLine}</p>
                                )}
                            </div>
                        </div>

                        {/* Detected Products (capped) */}
                        {previewProducts.length > 0 && (
                            <div className="flex flex-col text-left space-y-1.5">
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Detected Products</p>
                                <div className="rounded-xl border border-border/40 bg-white shadow-sm overflow-hidden">
                                    {/* Table Header */}
                                    <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 bg-muted/30 text-[11px] font-semibold uppercase text-muted-foreground tracking-wider border-b border-border/40">
                                        <div className="col-span-3">Product Type</div>
                                        <div className="col-span-2">Brand</div>
                                        <div className="col-span-4">Model</div>
                                        <div className="col-span-3">Confidence</div>
                                    </div>

                                    <div className="divide-y divide-border/40">
                                        {previewProducts.map((item, index) => {
                                            const itemBand = getConfidenceBand(item.confidence)
                                            const itemBarColor = getConfidenceBarColor(itemBand)
                                            const isUnknownBrand = !item.brand || item.brand.toLowerCase().includes("unknown")
                                            const isUnknownModel = !item.model || item.model.toLowerCase().includes("unknown")

                                            return (
                                                <div 
                                                    key={index} 
                                                    className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-2 items-center hover:bg-muted/10 transition-colors"
                                                >
                                                    <div className="col-span-1 md:col-span-3 text-sm font-medium text-foreground">
                                                        {item.type}
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 text-sm text-foreground/80">
                                                        <span className="md:hidden text-xs text-muted-foreground mr-2 uppercase">Brand:</span>
                                                        {!isUnknownBrand ? item.brand : <span className="text-muted-foreground italic">Unknown</span>}
                                                    </div>
                                                    <div className="col-span-1 md:col-span-4 text-sm text-foreground/80">
                                                        <span className="md:hidden text-xs text-muted-foreground mr-2 uppercase">Model:</span>
                                                        {!isUnknownModel ? item.model : <span className="text-muted-foreground italic">Unknown</span>}
                                                    </div>
                                                    <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                                                        <span className="md:hidden text-xs text-muted-foreground uppercase">Confidence:</span>
                                                        <div
                                                            className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"
                                                            role="progressbar"
                                                            aria-label={`${item.type} confidence`}
                                                        >
                                                            <div className={`h-full rounded-full ${itemBarColor}`} style={{ width: `${item.confidence}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                                            {itemBand}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {remainingProductCount > 0 && (
                                        <div className="px-4 py-2 border-t border-border/40">
                                            <p className="text-xs text-muted-foreground">+{remainingProductCount} more parts identified</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Recommended Accessories (compact chip row) */}
                        {previewRecs.length > 0 && (
                            <div className="flex flex-col text-left space-y-1">
                                <p className="text-sm font-semibold text-foreground">
                                    Recommended for Your {vehicleString}
                                </p>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {previewRecs.map((rec, i) => {
                                        const { name } = parseRecommendation(rec)
                                        return (
                                            <div
                                                key={i}
                                                className="border border-border text-foreground/70 text-sm px-2.5 py-1 rounded-lg bg-white"
                                            >
                                                {name}
                                            </div>
                                        )
                                    })}
                                    {remainingRecCount > 0 && (
                                        <span className="text-sm text-muted-foreground">+{remainingRecCount} more</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Link to full result */}
                        <div className="flex justify-end mt-2">
                            <Link 
                                href={`/r/${record.id}`} 
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                See the full sample result
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
