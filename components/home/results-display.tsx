import { Button } from "@/components/ui/button"
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader, ExternalLink, Wrench, Car, Brain, AlertTriangle } from "lucide-react"
import type { AnalysisResults, DetectedProduct, PartIdentification } from "@/app/actions"
import type { AnalysisMode } from "@/components/home/vehicle-analyzer"
import { addAmazonAffiliateTag } from "@/lib/amazon"
import { trackEvent } from "@/lib/analytics"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ResultsDisplayProps {
    results: AnalysisResults | null
    detectedProducts: DetectedProduct[]
    partIdentification?: PartIdentification | null
    error: string | null
    productError: string | null
    loadingMessage?: string | null
    progress: number
    detectedProductsTitle?: string
    analysisMode?: AnalysisMode
}

export function ResultsDisplay({
    results,
    detectedProducts,
    partIdentification,
    error,
    productError,
    loadingMessage,
    progress,
    detectedProductsTitle = "Detected Products",
    analysisMode = "vehicle",
}: ResultsDisplayProps) {
    const isLoading = loadingMessage !== null && loadingMessage !== ""

    // --- Part Identification Mode ---
    if (analysisMode === "part") {
        if (!isLoading && !partIdentification && !error) return null

        if (isLoading) {
            return (
                <section className="w-full bg-card py-24">
                    <div className="container max-w-4xl">
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="w-full max-w-md space-y-2">
                                <Progress value={progress} className="w-full h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{progress}%</span>
                                </div>
                            </div>
                            <p className="text-lg text-muted-foreground font-medium animate-pulse">
                                {loadingMessage}
                            </p>
                        </div>
                    </div>
                </section>
            )
        }

        if (error) {
            return (
                <section className="w-full bg-card py-24">
                    <div className="container max-w-4xl">
                        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    </div>
                </section>
            )
        }

        if (!partIdentification) return null

        const isLowConfidence = partIdentification.confidence < 30
        const confidenceColor =
            partIdentification.confidence >= 80 ? "text-emerald-600"
                : partIdentification.confidence >= 50 ? "text-amber-600"
                    : "text-red-500"
        const confidenceBarColor =
            partIdentification.confidence >= 80 ? "bg-emerald-500"
                : partIdentification.confidence >= 50 ? "bg-amber-500"
                    : "bg-red-500"

        return (
            <div className="space-y-6">
                {isLowConfidence && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                            Low confidence: this may not be a recognizable car part, or the image may be unclear.
                        </p>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium tracking-wider text-primary uppercase">
                                {partIdentification.category}
                            </span>
                        </div>
                        <CardTitle className="text-2xl">{partIdentification.partName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Confidence Bar */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-20 shrink-0">Confidence</span>
                            <div
                                className="flex-1 h-2 bg-muted rounded-full overflow-hidden"
                                role="progressbar"
                                aria-valuenow={partIdentification.confidence}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Identification confidence"
                            >
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", confidenceBarColor)}
                                    style={{ width: `${partIdentification.confidence}%` }}
                                />
                            </div>
                            <span className={cn("text-sm font-bold tabular-nums w-12 text-right", confidenceColor)}>
                                {partIdentification.confidence}%
                            </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                                <Wrench className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Function</p>
                                    <p className="text-sm text-foreground">{partIdentification.function}</p>
                                </div>
                            </div>

                            {partIdentification.estimatedVehicle && (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                                    <Car className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vehicle Match</p>
                                        <p className="text-sm text-foreground">{partIdentification.estimatedVehicle}</p>
                                    </div>
                                </div>
                            )}

                            <div className={cn("flex items-start gap-3 p-4 rounded-xl bg-muted/50", !partIdentification.estimatedVehicle && "md:col-span-2")}>
                                <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">How We Identified It</p>
                                    <p className="text-sm text-muted-foreground">{partIdentification.reasoning}</p>
                                </div>
                            </div>
                        </div>

                        {/* Amazon CTA */}
                        <a
                            href={addAmazonAffiliateTag(
                                `https://www.amazon.com/s?k=${encodeURIComponent(partIdentification.amazonSearchTerm)}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent("amazon_click", { product: partIdentification.partName })}
                        >
                            <Button size="lg" className="w-full sm:w-auto gap-2">
                                <Image
                                    src="/amazon-logo.png"
                                    alt="Amazon"
                                    width={70}
                                    height={21}
                                    className="h-4 w-auto object-contain"
                                />
                                <span>Find on Amazon</span>
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </a>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // --- Vehicle Analysis Mode (original) ---
    if (
        !isLoading &&
        !results &&
        !detectedProducts.length &&
        !error &&
        !productError
    ) {
        return null
    }

    // Helper to parse "Product Name (Context Description)"
    const parseRecommendation = (text: string) => {
        // Match the last occurrence of content in parentheses
        const match = text.match(/^(.*?)\s*\(([^)]+)\)$/)
        if (match) {
            return {
                name: match[1].trim(),
                description: match[2].trim()
            }
        }
        return { name: text, description: null }
    }

    return (
        <section id="results" className="w-full bg-card py-24">
            <div className="container max-w-4xl">
                {/* Master Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                        <div className="w-full max-w-md space-y-2">
                            <Progress value={progress} className="w-full h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{progress}%</span>
                            </div>
                        </div>
                        <p className="text-lg text-muted-foreground font-medium animate-pulse">
                            {loadingMessage}
                        </p>
                    </div>
                )}

                {/* Error States */}
                {error && (
                    <div className="mb-8 p-4 bg-destructive/10 border border-destructive rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}
                {productError && (
                    <div className="mb-8 p-4 bg-destructive/10 border border-destructive rounded-lg">
                        <p className="text-sm text-destructive">{productError}</p>
                    </div>
                )}

                {/* Results */}
                {!isLoading && (
                    <div className="grid grid-cols-1 gap-12">
                        {/* Fitment Results */}
                        {results && (
                            <div className="flex flex-col text-left space-y-4">
                                <h2 className="font-heading text-2xl font-bold">
                                    Vehicle Fitment Breakdown
                                </h2>

                                <div className="rounded-[1.5rem] border border-border/40 bg-white shadow-sm overflow-hidden p-6 md:p-8">
                                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                        Primary Identification
                                        <div className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                            {results.primary.confidence}% Confidence
                                        </div>
                                    </h3>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-8">
                                        <div className="space-y-1">
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year</div>
                                            <div className="text-lg font-semibold text-foreground">{results.primary.year}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Make</div>
                                            <div className="text-lg font-semibold text-foreground">{results.primary.make}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</div>
                                            <div className="text-lg font-semibold text-foreground">{results.primary.model}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trim</div>
                                            <div className="text-lg font-semibold text-foreground">{results.primary.trim}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cab Style</div>
                                            <div className="text-lg font-semibold text-foreground">{results.primary.cabStyle || "N/A"}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bed Length</div>
                                            <div className="text-lg font-semibold text-foreground">{results.primary.bedLength || "N/A"}</div>
                                        </div>
                                    </div>

                                    {/* Engine Details */}
                                    <div className="mt-8 pt-6 border-t border-border/40">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Engine Details</div>
                                        <p className="text-base text-foreground/80 leading-relaxed">
                                            {results.engineDetails || "No details available."}
                                        </p>
                                    </div>
                                </div>

                                {/* Other Possibilities */}
                                {results.otherPossibilities.some(item => item.name && item.name.trim() !== "") && (
                                    <div className="mt-8">
                                        <h3 className="font-semibold text-lg mb-4">Other Possibilities</h3>
                                        <div className="rounded-[1.5rem] border border-border/40 bg-white shadow-sm overflow-hidden">
                                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 text-xs font-semibold uppercase text-muted-foreground border-b border-border/40">
                                                <div className="col-span-10">Vehicle Name</div>
                                                <div className="col-span-2 text-right">Confidence</div>
                                            </div>
                                            <div className="divide-y divide-border/40">
                                                {results.otherPossibilities.map((item, index) => (
                                                    <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/10 transition-colors">
                                                        <div className="col-span-10 font-medium text-foreground">{item.name}</div>
                                                        <div className="col-span-2 text-right text-muted-foreground">{item.confidence}%</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Product Results */}
                        {detectedProducts && detectedProducts.length > 0 && (
                            <div className="flex flex-col text-left space-y-4">
                                <h2 className="font-heading text-2xl font-bold">
                                    {detectedProductsTitle}
                                </h2>

                                <div className="rounded-[1.5rem] border border-border/40 bg-white shadow-sm overflow-hidden">
                                    {/* Table Header */}
                                    <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-muted/30 text-xs font-semibold uppercase text-muted-foreground tracking-wider border-b border-border/40">
                                        <div className="col-span-3">Product Type</div>
                                        <div className="col-span-2">Brand</div>
                                        <div className="col-span-3">Model</div>
                                        <div className="col-span-2">Confidence</div>
                                        <div className="col-span-2 text-right">Action</div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="divide-y divide-border/40">
                                        {detectedProducts.map((item, index) => {
                                            const isUnknownBrand = !item.brand || item.brand.toLowerCase().includes("unknown")
                                            const isUnknownModel = !item.model || item.model.toLowerCase().includes("unknown")

                                            // Build Amazon search query
                                            let searchQuery = ""
                                            if (results) {
                                                const vehicleDetails = `${results.primary.year} ${results.primary.make} ${results.primary.model}`
                                                if (isUnknownBrand || isUnknownModel) {
                                                    searchQuery = `${vehicleDetails} ${item.type}`
                                                } else {
                                                    searchQuery = `${vehicleDetails} ${item.brand} ${item.model}`
                                                }
                                            } else {
                                                if (!isUnknownBrand && !isUnknownModel) {
                                                    searchQuery = `${item.brand} ${item.model}`
                                                } else {
                                                    searchQuery = item.type
                                                }
                                            }

                                            return (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 md:px-8 py-4 items-center hover:bg-muted/10 transition-colors">
                                                    {/* Mobile Labels are handled via flex/grid tricks or just hidden labels for simplicity in this replacement -> keeping clean table structure */}
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
                                                        {/* Accessible confidence indicator (A-07) */}
                                                        <div
                                                            className="flex-1 md:flex-none h-1.5 w-16 bg-muted rounded-full overflow-hidden"
                                                            role="progressbar"
                                                            aria-valuenow={item.confidence}
                                                            aria-valuemin={0}
                                                            aria-valuemax={100}
                                                            aria-label={`${item.type} confidence`}
                                                        >
                                                            <div className="h-full bg-primary/70 rounded-full" style={{ width: `${item.confidence}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-muted-foreground">{item.confidence}%</span>
                                                    </div>

                                                    <div className="col-span-1 md:col-span-2 text-right">
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full md:w-auto h-8 px-4 rounded-full hover:bg-[#D1E7F0] border-primary/20"
                                                        >
                                                            <a
                                                                href={addAmazonAffiliateTag(`https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center"
                                                                onClick={() => trackEvent('amazon_click', { product: item.type, query: searchQuery })}
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
                                                            We think there are {item.type} on your vehicle but we couldn’t identify the Brand and/or Model
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recommended Accessories */}
                        {results && (
                            <div className="flex flex-col text-left">
                                <h2 className="font-heading text-2xl font-bold mb-6">
                                    Popular & Recommended Products for Your {results.primary.year} {results.primary.make} {results.primary.model}
                                </h2>

                                {results.tieredRecommendations && results.tieredRecommendations.length > 0 ? (
                                    <div className="space-y-8">
                                        {results.tieredRecommendations.map((tier, tIdx) => (
                                            <div key={tIdx}>
                                                <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">{tier.title}</h3>
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                    {tier.items.map((accessory, index) => {
                                                        const { name, description } = parseRecommendation(accessory)
                                                        const vehicleDetails = `${results.primary.year} ${results.primary.make} ${results.primary.model} ${results.primary.trim}`
                                                        const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
                                                            vehicleDetails
                                                        )}+${encodeURIComponent(name)}`

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
                                                                    <Button
                                                                        asChild
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="w-full hover:bg-[#D1E7F0]"
                                                                    >
                                                                        <a
                                                                            href={addAmazonAffiliateTag(amazonSearchUrl)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center justify-center gap-2"
                                                                            onClick={() => trackEvent('amazon_click', { product: name })}
                                                                        >
                                                                            <span className="text-xs font-medium text-muted-foreground">Buy on</span>
                                                                            <Image
                                                                                src="/amazon-logo.png"
                                                                                alt="Amazon"
                                                                                width={80}
                                                                                height={24}
                                                                                className="h-5 w-auto object-contain mt-1"
                                                                            />
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
                                        {results.recommendedAccessories.map((accessory, index) => {
                                            const { name, description } = parseRecommendation(accessory)
                                            const vehicleDetails = `${results.primary.year} ${results.primary.make} ${results.primary.model} ${results.primary.trim}`
                                            const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
                                                vehicleDetails
                                            )}+${encodeURIComponent(name)}`

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
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full hover:bg-[#D1E7F0]"
                                                        >
                                                            <a
                                                                href={addAmazonAffiliateTag(amazonSearchUrl)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center gap-2"
                                                                onClick={() => trackEvent('amazon_click', { product: name })}
                                                            >
                                                                <span className="text-xs font-medium text-muted-foreground">Buy on</span>
                                                                <Image
                                                                    src="/amazon-logo.png"
                                                                    alt="Amazon"
                                                                    width={80}
                                                                    height={24}
                                                                    className="h-5 w-auto object-contain mt-1"
                                                                />
                                                            </a>
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}
