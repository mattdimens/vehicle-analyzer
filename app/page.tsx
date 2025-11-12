"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Loader,
  X,
  ExternalLink,
  Send,
} from "lucide-react"
import {
  createSignedUploadUrl,
  analyzeVehicleImage,
  analyzeProductsOnVehicle,
} from "@/app/actions"
import { getBrowserClient } from "@/lib/supabase"

// --- Interfaces ---
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

// --- State Types ---
type AnalysisState = "idle" | "fitment" | "products" | "all"
type AnalysisSelection = "default" | "fitment" | "products" | "all"

export default function VehicleAccessoryFinder() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // --- State Management ---
  const [analysisState, setAnalysisState] =
    useState<AnalysisState>("idle")
  const [
    selectedAnalysis,
    setSelectedAnalysis,
  ] = useState<AnalysisSelection>("default")
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [detectedProducts, setDetectedProducts] = useState<
    DetectedProduct[] | null
  >(null)
  const [publicImageUrl, setPublicImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)

  const clearAll = () => {
    setUploadedFile(null)
    setPreview(null)
    setResults(null)
    setError(null)
    setPublicImageUrl(null)
    setDetectedProducts(null)
    setProductError(null)
    setAnalysisState("idle")
    setSelectedAnalysis("default")
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      clearAll() // Clear everything on new upload
      const file = acceptedFiles[0]
      setUploadedFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    noClick: !!preview, // Disable click if preview is shown
    noKeyboard: !!preview,
  })

  const clearPreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    clearAll()
  }

  // --- Utility Function to Upload Image ---
  const getOrUploadImage = async (): Promise<string> => {
    if (publicImageUrl) {
      console.log("[v4] Using cached image URL")
      return publicImageUrl
    }
    if (!uploadedFile) {
      throw new Error("No file uploaded.")
    }

    console.log("[v4] Uploading file to get URL...")
    const signedUrlResponse = await createSignedUploadUrl(
      uploadedFile.name,
      uploadedFile.type
    )
    if (!signedUrlResponse.success) {
      throw new Error(
        signedUrlResponse.error || "Failed to get signed upload URL"
      )
    }
    const { signedUrl, path } = signedUrlResponse.data

    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": uploadedFile.type },
      body: uploadedFile,
    })
    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to storage")
    }

    const supabase = getBrowserClient()
    const { data: publicUrlData } = supabase.storage.getPublicUrl
      ? supabase.storage.getPublicUrl("vehicle_images", path)
      : supabase.storage.from("vehicle_images").getPublicUrl(path)

    const newPublicUrl = publicUrlData.publicUrl
    console.log("[v4] Public URL obtained:", newPublicUrl)
    setPublicImageUrl(newPublicUrl) // Cache it
    return newPublicUrl
  }

  // --- Individual Handlers ---
  const handleAnalyzeFitment = async () => {
    setAnalysisState("fitment")
    setError(null)
    setProductError(null)
    try {
      const url = await getOrUploadImage()
      const response = await analyzeVehicleImage(url)
      if (!response.success) {
        throw new Error(response.error || "Failed to analyze vehicle")
      }
      setResults(response.data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      console.error("[v4] Fitment error:", msg)
      setError(msg)
    } finally {
      setAnalysisState("idle")
    }
  }

  const handleDetectProducts = async () => {
    setAnalysisState("products")
    setError(null)
    setProductError(null)
    try {
      const url = await getOrUploadImage()
      const vehicleDetails = results
        ? `${results.primary.year} ${results.primary.make} ${results.primary.model} ${results.primary.trim}`
        : null
      const response = await analyzeProductsOnVehicle(url, vehicleDetails)
      if (!response.success) {
        throw new Error(response.error || "Failed to detect products")
      }
      setDetectedProducts(response.data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      console.error("[v4] Product error:", msg)
      setProductError(msg)
    } finally {
      setAnalysisState("idle")
    }
  }

  const handleAnalyzeAll = async () => {
    setAnalysisState("all")
    setError(null)
    setProductError(null)
    try {
      const url = await getOrUploadImage()
      const fitmentResponse = await analyzeVehicleImage(url)
      if (!fitmentResponse.success) {
        throw new Error(fitmentResponse.error || "Failed to analyze vehicle")
      }
      setResults(fitmentResponse.data)
      const vehicleDetails = `${fitmentResponse.data.primary.year} ${fitmentResponse.data.primary.make} ${fitmentResponse.data.primary.model} ${fitmentResponse.data.primary.trim}`
      const productResponse = await analyzeProductsOnVehicle(url, vehicleDetails)
      if (!productResponse.success) {
        throw new Error(productResponse.error || "Failed to detect products")
      }
      setDetectedProducts(productResponse.data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      console.error("[v4] 'All' error:", msg)
      setError(msg)
    } finally {
      setAnalysisState("idle")
    }
  }

  // --- "Start" Button Handler ---
  const handleSend = () => {
    if (analysisState !== "idle" || !uploadedFile || selectedAnalysis === "default") return

    switch (selectedAnalysis) {
      case "fitment":
        handleAnalyzeFitment()
        break
      case "products":
        handleDetectProducts()
        break
      case "all":
        handleAnalyzeAll()
        break
    }
  }


  function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).map(String).join(" ")
  }
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section
        id="hero"
        className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center justify-center px-4 py-24 text-center"
      >
        <div className="max-w-4xl w-full">
          <h1 className="font-heading text-5xl font-bold md:text-7xl">
            See the Parts. Find the Products.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Upload an image of any vehicle and our AI will instantly identify
            fitment and compatible accessories.
          </p>

          {/* --- NEW PROMPT/DROPZONE AREA --- */}
          <div className="mt-10 w-full max-w-2xl mx-auto rounded-2xl border bg-card shadow-lg">
            {/* This is the dropzone part */}
            <div
              {...getRootProps()}
              className={cn(
                "min-h-48 w-full p-6 flex flex-col justify-center items-center transition-colors rounded-t-2xl",
                !preview &&
                  (isDragActive
                    ? "bg-primary/5 cursor-pointer"
                    : "hover:bg-muted/50 cursor-pointer")
              )}
            >
              <input {...getInputProps()} />

              {!preview && (
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {isDragActive
                      ? "Drop the image here ..."
                      : "Drag 'n' drop an image, or click to select"}
                  </p>
                </div>
              )}

              {preview && (
                <div className="relative w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-border bg-background p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <img
                      src={preview}
                      alt="Vehicle preview"
                      className="w-20 h-20 rounded-md object-cover border"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadedFile?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Image selected
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={clearPreview}
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* --- CONTROL BAR --- */}
            <div className="flex items-center gap-4 p-4 border-t bg-muted/50 rounded-b-2xl">
              {/* HTML Select, styled with Tailwind */}
              <select
                value={selectedAnalysis}
                onChange={(e) =>
                  setSelectedAnalysis(e.target.value as AnalysisSelection)
                }
                className="h-9 px-3 rounded-md border bg-card text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={analysisState !== "idle"}
              >
                <option value="default" disabled>Choose Analysis...</option>
                <option value="fitment">Analyze Fitment</option>
                <option value="products">Detect Products</option>
                <option value="all">Fitment & Products</option>
              </select>

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Start Button */}
              <Button
                onClick={handleSend}
                disabled={
                  !uploadedFile ||
                  analysisState !== "idle" ||
                  selectedAnalysis === "default"
                }
                size="default"
              >
                {analysisState === "idle" ? (
                  <>
                    Start
                    <Send className="w-4 h-4" />
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                )}
              </Button>
            </div>
          </div>
          {/* --- END NEW PROMPT AREA --- */}

          {/* Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">Instant Identification</Badge>
            <Badge variant="secondary">Accessory Matching</Badge>
            <Badge variant="secondary">No Sign-Up Required</Badge>
          </div>
        </div>
      </section>

      {/* --- RESULTS SECTION --- */}
      {(analysisState !== "idle" ||
        results ||
        detectedProducts ||
        error ||
        productError) && (
        <section id="results" className="w-full bg-card py-24">
          <div className="container max-w-4xl">
            {/* Master Loading State */}
            {analysisState !== "idle" && (
              <div className="flex flex-col items-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-muted-foreground">
                  {analysisState === "fitment" &&
                    "Analyzing vehicle fitment..."}
                  {analysisState === "products" &&
                    "Detecting visible products..."}
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
                            <div className="font-medium">
                              {results.primary.make}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Model</div>
                            <div className="font-medium">
                              {results.primary.model}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Year</div>
                            <div className="font-medium">
                              {results.primary.year}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Trim</div>
                            <div className="font-medium">
                              {results.primary.trim}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Cab Style
                            </div>
                            <div className="font-medium">
                              {results.primary.cabStyle || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Bed Length
                            </div>
                            <div className="font-medium">
                              {results.primary.bedLength || "N/A"}
                            </div>
                          </div>
                          <div className="col-span-3">
                            <div className="text-muted-foreground">
                              Confidence
                            </div>
                            <div className="font-medium">
                              {results.primary.confidence}%
                            </div>
                          </div>
                        </div>

                        {/* Engine Details */}
                        <h3 className="font-semibold mt-8 mb-3">
                          Engine Details
                        </h3>
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
                                <th className="px-4 py-3 font-medium">
                                  Vehicle
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  Year Range
                                </th>
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
                                  <td className="px-4 py-3">
                                    {item.yearRange}
                                  </td>
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
                          onClick={handleDetectProducts}
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
                      onClick={handleAnalyzeFitment}
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
                            <th className="px-4 py-3 font-medium">
                              Brand / Model
                            </th>
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
                              <td className="px-4 py-3">
                                {item.brandModel}
                              </td>
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
                      {results.recommendedAccessories.map(
                        (accessory, index) => {
                          const vehicleDetails = `${results.primary.year} ${results.primary.make} ${results.primary.model} ${results.primary.trim}`
                          const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
                            vehicleDetails
                          )}+${encodeURIComponent(accessory)}`

                          return (
                            <Card
                              key={index}
                              className="transition-all hover:shadow-md"
                            >
                              <CardHeader>
                                <div className="flex items-center justify-between gap-4">
                                  <CardTitle className="text-lg">
                                    {accessory}
                                  </CardTitle>
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
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- v5: MODIFIED "How It Works" SECTION --- */}
      <section id="how-it-works" className="w-full bg-muted/50 py-24">
        <div className="container max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get from image to analysis in three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <Card>
              <CardHeader className="text-left">
                <CardDescription className="font-medium text-primary">
                  Step 1
                </CardDescription>
                <CardTitle>Upload Vehicle Image</CardTitle>
                <CardDescription>
                  Drag any vehicle image into the dropzone, or click to select
                  one from your device.
                </CardDescription>
              </CardHeader>
            </Card>
            {/* Step 2 */}
            <Card>
              <CardHeader className="text-left">
                <CardDescription className="font-medium text-primary">
                  Step 2
                </CardDescription>
                <CardTitle>Choose Analysis</CardTitle>
                <CardDescription>
                  Select what you want to find: "Analyze Fitment", "Detect
                  Products", or "Fitment & Products".
                </CardDescription>
              </CardHeader>
            </Card>
            {/* Step 3 */}
            <Card>
              <CardHeader className="text-left">
                <CardDescription className="font-medium text-primary">
                  Step 3
                </CardDescription>
                <CardTitle>Get Instant Insights</CardTitle>
                <CardDescription>
                  Click "Start" to get a detailed, AI-powered breakdown of your
                  vehicle and its parts.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* --- v5: MODIFIED "Use Cases" SECTION --- */}
      <section id="use-cases" className="w-full py-24">
        <div className="container max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-4xl font-bold">Use Cases</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Perfect for enthusiasts, shoppers, and professionals.
            </p>
          </div>
          {/* v5: Updated grid columns and new items */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {[
              {
                title: "Accessory Shoppers",
                desc: "Shopping for accessories? Upload a picture of your ride to instantly identify its exact fitment, ensuring you buy the right parts, hassle-free.",
              },
              {
                title: "Enthusiasts",
                desc: "See a setup you love at a car show or online? Snap a photo, run the product detector, and get a list of the visible mods, from wheels to roof racks.",
              },
              {
                title: "Detailers & Shops",
                desc: "Log customer vehicles as they arrive. Get an instant, AI-generated record of the vehicle's make, model, trim, and color for your files.",
              },
              {
                title: "Inspiration",
                desc: "Building your dream ride? Upload inspiration photos to identify parts and find out what's compatible with your own vehicle to replicate the look.",
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="transition-all hover:scale-[1.03] hover:shadow-lg text-left"
              >
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}