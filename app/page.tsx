"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle, Loader } from "lucide-react"
import { createSignedUploadUrl, analyzeVehicleImage } from "@/app/actions"
import { getBrowserClient } from "@/lib/supabase"

export default function VehicleAccessoryFinder() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<{
    vehicleType: string
    make: string
    model: string
    year: number | null
    color: string
    condition: string
    recommendedAccessories: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadedFile(file)
      setError(null)

      // Create preview
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
  })

  const handleAnalysis = async () => {
    if (!uploadedFile) return

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log("[v0] Starting analysis for file:", uploadedFile.name)

      // Step 1: Get signed upload URL
      const signedUrlResponse = await createSignedUploadUrl(uploadedFile.name, uploadedFile.type)
      if (!signedUrlResponse.success) {
        throw new Error(signedUrlResponse.error || "Failed to get signed upload URL")
      }
      const { signedUrl, path } = signedUrlResponse.data
      console.log("[v0] Signed URL obtained")

      // Step 2: Upload file to signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": uploadedFile.type,
        },
        body: uploadedFile,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage")
      }
      console.log("[v0] File uploaded successfully")

      // Step 3: Get public URL
      const supabase = getBrowserClient()
      const { data: publicUrlData } = supabase.storage.getPublicUrl
  ? supabase.storage.getPublicUrl("vehicle_images", path) // This is the new way
  : supabase.storage.from("vehicle_images").getPublicUrl(path) // This is the old way
      const publicImageUrl = publicUrlData.publicUrl
      console.log("[v0] Public URL obtained:", publicImageUrl)

      // Step 4: Call server action to analyze image
      const analysisResponse = await analyzeVehicleImage(publicImageUrl)
      if (!analysisResponse.success) {
        throw new Error(analysisResponse.error || "Failed to analyze vehicle")
      }

      console.log("[v0] Analysis completed successfully")

      // Step 5: Extract and display results
      const analysisData = analysisResponse.data
      setResults({
        vehicleType: analysisData.vehicleType,
        make: analysisData.make,
        model: analysisData.model,
        // keep as number | null to match state type
        year: analysisData.year,
        color: analysisData.color,
        condition: analysisData.condition,
        recommendedAccessories: analysisData.recommendedAccessories,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during analysis"
      console.error("[v0] Error during analysis:", errorMessage)
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).map(String).join(' ')
  }
  return (
    <div className="flex flex-col">
      {/* Hero Section (Already Centered) */}
      <section
        id="hero"
        className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center justify-center px-4 py-24 text-center"
      >
        <div className="max-w-4xl">
          <h1 className="font-heading text-5xl font-bold md:text-7xl">
            See the Parts. Find the Products.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Upload an image of any vehicle and our AI will instantly identify
            fitment and compatible accessories.
          </p>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              'mt-10 min-h-48 w-full cursor-pointer rounded-xl border-2 border-dashed border-border p-12 shadow-inner transition-colors hover:bg-accent/10',
              isDragActive ? 'border-accent' : ''
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-4">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">
                {isDragActive
                  ? 'Drop the image here ...'
                  : "Drag 'n' drop an image, or click to select"}
              </p>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-3">Image Preview</p>
              <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden border border-border">
                <img src={preview} alt="Vehicle preview" className="w-full h-auto object-cover" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{uploadedFile?.name}</p>
            </div>
          )}

          {/* Button */}
          <div className="flex justify-center mt-8">
            <Button 
              onClick={handleAnalysis} 
              disabled={!uploadedFile || isAnalyzing} 
              size="lg" 
              className="min-w-xs"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Analyzing...
                </div>
              ) : (
                "Analyze Vehicle"
              )}
            </Button>
          </div>

          {/* Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">Instant Identification</Badge>
            <Badge variant="secondary">Accessory Matching</Badge>
            <Badge variant="secondary">No Sign-Up Required</Badge>
          </div>
        </div>
      </section>

      {/* Loading & Results Section (Already Centered) */}
      {(isAnalyzing || error || results) && (
        <section id="results" className="w-full bg-white py-24 flex flex-col items-center">
          <div className="container max-w-4xl px-4">

            {isAnalyzing && (
              <div className="flex flex-col items-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-muted-foreground">
                  Analyzing image...
                </p>
              </div>
            )}

            {error && (
              <div className="mb-8 p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {results && !isAnalyzing && (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex flex-col text-left"> {/* Keep results text left-aligned */}
                  {preview && (
                    <img
                      src={preview}
                      alt="Uploaded Vehicle"
                      className="mb-6 aspect-video w-full rounded-lg object-cover border"
                    />
                  )}
                  <Card>
                    <CardHeader>
                      <CardTitle>Vehicle Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Make:</span>
                        <span className="font-medium">{results.make}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="font-medium">{results.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year:</span>
                        <span className="font-medium">{results.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{results.vehicleType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Color:</span>
                        <span className="font-medium">{results.color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Condition:</span>
                        <span className="font-medium capitalize">{results.condition}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex flex-col text-left"> {/* Keep results text left-aligned */}
                  <h2 className="font-heading text-2xl font-bold">
                    Recommended Accessories
                  </h2>
                  <div className="mt-4 space-y-4">
                    {results.recommendedAccessories.map((accessory, index) => {
                      const vehicleDetails = `${results.year} ${results.make} ${results.model}`
                      const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
                        vehicleDetails,
                      )}+${encodeURIComponent(accessory)}`

                      return (
                        <Card key={index} className="transition-all hover:shadow-md">
                          <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                              <CardTitle className="text-lg">
                                {accessory}
                              </CardTitle>
                              <Button asChild variant="outline" size="sm" className="shrink-0">
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
              </div>
            )}
          </div>
        </section>
      )}

      {/* === THIS SECTION IS UPDATED === */}
      <section 
        id="how-it-works" 
        className="w-full bg-muted/50 py-24 flex flex-col items-center text-center"
      >
        <div className="max-w-6xl px-4"> {/* Use max-w-6xl and px-4 instead of 'container' */}
          <div className="mb-12"> {/* 'text-center' is removed, parent provides it */}
            <h2 className="font-heading text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get from image to analysis in three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card>
              <CardHeader className="items-center text-center">
                <Upload className="h-10 w-10 text-accent mb-4" />
                <CardTitle>1. Upload or Drop</CardTitle>
                <CardDescription>
                  Drag any vehicle image into the drop zone or click to select
                  one from your device.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="items-center text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-accent mb-4"
                >
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                </svg>
                <CardTitle>2. AI Analyzes</CardTitle>
                <CardDescription>
                  Our model identifies the vehicle's year, make, model, and
                  visible accessories.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="items-center text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-accent mb-4"
                >
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                </svg>
                <CardTitle>3. Get Insights</CardTitle>
                <CardDescription>
                  Review the extracted data and get Amazon search links for
                  matched products.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* === THIS SECTION IS UPDATED === */}
      <section 
        id="use-cases" 
        className="w-full py-24 flex flex-col items-center text-center"
      >
        <div className="max-w-6xl px-4"> {/* Use max-w-6xl and px-4 instead of 'container' */}
          <div className="mb-12"> {/* 'text-center' is removed, parent provides it */}
            <h2 className="font-heading text-4xl font-bold">Use Cases</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Perfect for enthusiasts, shoppers, and professionals.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Accessory Shoppers',
                desc: 'Find parts you know will fit your car or truck.',
              },
              {
                title: 'Enthusiasts',
                desc: 'Identify that cool mod you saw on a car at a show.',
              },
              {
                title: 'Marketplace Sellers',
                desc: 'Quickly find parts to list for a vehicle you are parting out.',
              },
              {
                title: 'Detailers & Shops',
                desc: 'Keep a quick visual record of customer vehicles.',
              },
              {
                title: 'Inspiration',
                desc: 'See a setup you like? Find out what it is in seconds.',
              },
              {
                title: 'Affiliate Marketers',
                desc: 'Generate product links from any user-submitted image.',
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="transition-all hover:scale-[1.03] hover:shadow-lg"
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