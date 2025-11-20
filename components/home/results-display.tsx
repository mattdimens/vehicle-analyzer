import { Button } from "@/components/ui/button"
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card"
import { Loader, ExternalLink } from "lucide-react"

// Define interfaces locally or import them.
// For now, I'll define them here to match page.tsx
interface PrimaryVehicle {
    make: string
    model: string
    year: string
    trim: string
    cabStyle: string | null
    bedLength: string | null
    vehicleType: string
    color: string
    condition: string
    confidence: number
}

interface OtherPossibility {
    vehicle: string
    yearRange: string
    trim: string
    confidence: number
}

interface AnalysisResults {
    primary: PrimaryVehicle
    engineDetails: string | null
    otherPossibilities: OtherPossibility[]
    recommendedAccessories: string[]
}

interface DetectedProduct {
    productType: string
    brandModel: string
    confidence: number
}

type AnalysisState = "idle" | "fitment" | "products" | "all"

interface ResultsDisplayProps {
    analysisState: AnalysisState
    results: AnalysisResults | null
    detectedProducts: DetectedProduct[] | null
    error: string | null
    productError: string | null
    onAnalyzeFitment: () => void
    onDetectProducts: () => void
}

export function ResultsDisplay({
    analysisState,
    results,
    detectedProducts,
    error,
    productError,
    onAnalyzeFitment,
    onDetectProducts,
}: ResultsDisplayProps) {
    if (
        analysisState === "idle" &&
        !results &&
        !detectedProducts &&
        !error &&
        !productError
    ) {
        return null
    }

    return (
        <section id="results" className="w-full bg-card py-24">
            <div className="container max-w-4xl">
                {/* Master Loading State */}
                {analysisState !== "idle" && (
                    <div className="flex flex-col items-center">
                        <Loader className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-lg text-muted-foreground">
                            {analysisState === "fitment" && "Analyzing vehicle fitment..."}
                            {analysisState === "products" && "Detecting visible products..."}
                            {analysisState === "all" && "Running Fitment & Products..."}
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
                {analysisState === "idle" && (
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
                                        <h3 className="font-semibold mt-8 mb-3">
                                            Other Possibilities
                                        </h3>
                                        <div className="overflow-x-auto rounded-lg border">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium">Vehicle</th>
                                                        <th className="px-4 py-3 font-medium">Year Range</th>
                                                        <th className="px-4 py-3 font-medium">Trim</th>
                                                        <th className="px-4 py-3 font-medium text-right">
                                                            Confidence
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {results.otherPossibilities.map((item, index) => (
                                                        <tr key={index} className="border-t">
                                                            <td className="px-4 py-3 font-medium">
                                                                {item.vehicle}
                                                            </td>
                                                            <td className="px-4 py-3">{item.yearRange}</td>
                                                            <td className="px-4 py-3">{item.trim}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                {item.confidence}%
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Conditional "Detect Products" Button */}
                                {!detectedProducts && !productError && (
                                    <div className="mt-8">
                                        <Button
                                            onClick={onDetectProducts}
                                            disabled={analysisState !== "idle"}
                                            className="w-full"
                                            size="lg"
                                        >
                                            Detect Products on Vehicle
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Conditional "Analyze Fitment" Button */}
                        {detectedProducts && !results && !error && (
                            <div className="flex flex-col text-left">
                                <Button
                                    onClick={onAnalyzeFitment}
                                    disabled={analysisState !== "idle"}
                                    className="w-full"
                                    size="lg"
                                >
                                    Analyze Vehicle Fitment
                                </Button>
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
                                                <th className="px-4 py-3 font-medium">Brand / Model</th>
                                                <th className="px-4 py-3 font-medium">Link</th>
                                                <th className="px-4 py-3 font-medium text-right">
                                                    Confidence
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detectedProducts.map((item, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="px-4 py-3 font-medium">
                                                        {item.productType}
                                                    </td>
                                                    <td className="px-4 py-3">{item.brandModel}</td>
                                                    <td className="px-4 py-3">
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5"
                                                        >
                                                            <a
                                                                href={`https://www.amazon.com/s?k=${encodeURIComponent(
                                                                    results
                                                                        ? `${results.primary.make} ${results.primary.model}`
                                                                        : ""
                                                                )} ${encodeURIComponent(item.brandModel)}`}
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
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Recommended Accessories */}
                        {results && (
                            <div className="flex flex-col text-left">
                                <h2 className="font-heading text-2xl font-bold">
                                    Recommended Accessories
                                </h2>
                                <div className="mt-4 space-y-4">
                                    {results.recommendedAccessories.map((accessory, index) => {
                                        const vehicleDetails = `${results.primary.year} ${results.primary.make} ${results.primary.model} ${results.primary.trim}`
                                        const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
                                            vehicleDetails
                                        )}+${encodeURIComponent(accessory)}`

                                        return (
                                            <Card key={index} className="transition-all hover:shadow-md">
                                                <CardHeader>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <CardTitle className="text-lg">{accessory}</CardTitle>
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                            className="shrink-0"
                                                        >
                                                            <a
                                                                href={amazonSearchUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Find on Amazon
                                                            </a>
                                                        </Button>
                                                    </div>
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
