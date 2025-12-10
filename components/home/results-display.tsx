import { Button } from "@/components/ui/button"
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader, ExternalLink } from "lucide-react"
import type { AnalysisResults, DetectedProduct } from "@/app/actions"
import { addAmazonAffiliateTag } from "@/lib/amazon"

interface ResultsDisplayProps {
    results: AnalysisResults | null
    detectedProducts: DetectedProduct[]
    error: string | null
    productError: string | null
    loadingMessage?: string | null
    progress: number
    detectedProductsTitle?: string
}

export function ResultsDisplay({
    results,
    detectedProducts,
    error,
    productError,
    loadingMessage,
    progress,
    detectedProductsTitle = "Detected Products",
}: ResultsDisplayProps) {
    const isLoading = loadingMessage !== null && loadingMessage !== ""

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
                                                        {/* Simple visual indicator for confidence */}
                                                        <div className="flex-1 md:flex-none h-1.5 w-16 bg-muted rounded-full overflow-hidden">
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
                                                            >
                                                                <span className="sr-only">Search on Amazon</span>
                                                                <img
                                                                    src="/amazon-logo.png"
                                                                    alt="Amazon"
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
                                                                        >
                                                                            <span className="text-xs font-medium text-muted-foreground">Buy on</span>
                                                                            <img
                                                                                src="/amazon-logo.png"
                                                                                alt="Amazon"
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
                                                            >
                                                                <span className="text-xs font-medium text-muted-foreground">Buy on</span>
                                                                <img
                                                                    src="/amazon-logo.png"
                                                                    alt="Amazon"
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
