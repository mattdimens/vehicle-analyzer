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
}

export function ResultsDisplay({
    results,
    detectedProducts,
    error,
    productError,
    loadingMessage,
    progress,
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
                            <div className="flex flex-col text-left">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Primary Vehicle Identification</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Grid for primary details */}
                                        <div className="grid grid-cols-3 gap-x-4 gap-y-6 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Make</div>
                                                <div className="font-medium">{results.primary.make}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Model</div>
                                                <div className="font-medium">{results.primary.model}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Year</div>
                                                <div className="font-medium">{results.primary.year}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Trim</div>
                                                <div className="font-medium">{results.primary.trim}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Cab Style</div>
                                                <div className="font-medium">
                                                    {results.primary.cabStyle || "N/A"}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Bed Length</div>
                                                <div className="font-medium">
                                                    {results.primary.bedLength || "N/A"}
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <div className="text-muted-foreground">Confidence</div>
                                                <div className="font-medium">
                                                    {results.primary.confidence}%
                                                </div>
                                            </div>
                                        </div>

                                        {/* Engine Details */}
                                        <h3 className="font-semibold mt-8 mb-3">Engine Details</h3>
                                        <p className="text-sm">
                                            {results.engineDetails || "No details available."}
                                        </p>

                                        {/* Other Possibilities */}
                                        {results.otherPossibilities.some(item => item.name && item.name.trim() !== "") && (
                                            <>
                                                <h3 className="font-semibold mt-8 mb-3">
                                                    Other Possibilities
                                                </h3>
                                                <div className="overflow-x-auto rounded-lg border">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-muted/50">
                                                            <tr>
                                                                <th className="px-4 py-3 font-medium">Vehicle</th>
                                                                <th className="px-4 py-3 font-medium text-right">
                                                                    Confidence
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {results.otherPossibilities.map((item, index) => (
                                                                <tr key={index} className="border-t">
                                                                    <td className="px-4 py-3 font-medium">
                                                                        {item.name}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        {item.confidence}%
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Product Results */}
                        {detectedProducts && (
                            <div className="flex flex-col text-left">
                                <h2 className="font-heading text-2xl font-bold mb-4">
                                    Detected Products
                                </h2>
                                <div className="overflow-x-auto rounded-lg border">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Product</th>
                                                <th className="px-4 py-3 font-medium">Brand</th>
                                                <th className="px-4 py-3 font-medium">Model</th>
                                                <th className="px-4 py-3 font-medium">Link</th>
                                                <th className="px-4 py-3 font-medium text-right">
                                                    Confidence
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detectedProducts.map((item, index) => {
                                                const isUnknownBrand = !item.brand || item.brand.toLowerCase().includes("unknown")
                                                const isUnknownModel = !item.model || item.model.toLowerCase().includes("unknown")

                                                // Build Amazon search query
                                                let searchQuery = ""
                                                if (results) {
                                                    const vehicleDetails = `${results.primary.year} ${results.primary.make} ${results.primary.model}`

                                                    if (isUnknownBrand || isUnknownModel) {
                                                        // For unknown brand/model, only search vehicle + product type
                                                        searchQuery = `${vehicleDetails} ${item.type}`
                                                    } else {
                                                        // For known brand/model, include everything
                                                        searchQuery = `${vehicleDetails} ${item.brand} ${item.model}`
                                                    }
                                                } else {
                                                    // Fallback if no vehicle results
                                                    if (!isUnknownBrand && !isUnknownModel) {
                                                        searchQuery = `${item.brand} ${item.model}`
                                                    } else {
                                                        searchQuery = item.type
                                                    }
                                                }

                                                return (
                                                    <tr key={index} className="border-t">
                                                        <td className="px-4 py-3 font-medium">
                                                            {item.type}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {!isUnknownBrand && item.brand}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {!isUnknownModel && item.model}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1.5"
                                                            >
                                                                <a
                                                                    href={addAmazonAffiliateTag(`https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                    Search
                                                                </a>
                                                            </Button>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {item.confidence}%
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Recommended Accessories */}
                        {results && (
                            <div className="flex flex-col text-left">
                                <h2 className="font-heading text-2xl font-bold mb-6">
                                    Popular & Recommended Products for Your {results.primary.year} {results.primary.make} {results.primary.model}
                                </h2>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {results.recommendedAccessories.map((accessory, index) => {
                                        const vehicleDetails = `${results.primary.year} ${results.primary.make} ${results.primary.model} ${results.primary.trim}`
                                        const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
                                            vehicleDetails
                                        )}+${encodeURIComponent(accessory)}`

                                        return (
                                            <Card key={index} className="transition-all hover:shadow-md">
                                                <CardHeader>
                                                    <CardTitle className="text-base mb-3">{accessory}</CardTitle>
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                    >
                                                        <a
                                                            href={addAmazonAffiliateTag(amazonSearchUrl)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Search on Amazon
                                                        </a>
                                                    </Button>
                                                </CardHeader>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}
