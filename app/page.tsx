"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
    year: string | null
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
      const signedUrlResponse = await createSignedUploadUrl(uploadedFile.name)
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
      const { data: publicUrlData } = supabase.storage.from("vehicle_images").getPublicUrl(path)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">Vehicle Accessory Finder</h1>
          <p className="text-muted-foreground">Upload an image of your vehicle to discover the perfect accessories</p>
        </div>

        {/* Dropzone */}
        <div className="mb-8">
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium text-primary">Drop your vehicle image here</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-1">Drop your vehicle image here</p>
                <p className="text-sm text-muted-foreground">or click to browse your files</p>
              </div>
            )}
          </div>

          {/* Image Preview */}
          {preview && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-3">Image Preview</p>
              <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden border border-border">
                <img src={preview || "/placeholder.svg"} alt="Vehicle preview" className="w-full h-auto object-cover" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{uploadedFile?.name}</p>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center mb-12">
          <Button onClick={handleAnalysis} disabled={!uploadedFile || isAnalyzing} size="lg" className="min-w-xs">
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

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Analysis Results</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {results.year} {results.make} {results.model}
              </p>
            </div>

            {/* Vehicle Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="font-semibold">{results.vehicleType}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Color</p>
                <p className="font-semibold">{results.color}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Condition</p>
                <p className="font-semibold capitalize">{results.condition}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Year</p>
                <p className="font-semibold">{results.year || "Unknown"}</p>
              </Card>
            </div>

            {/* Recommended Accessories */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommended Accessories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.recommendedAccessories.map((accessory, index) => {
                  const vehicleDetails = `${results.year} ${results.make} ${results.model}`
                  const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
                    vehicleDetails,
                  )}+${encodeURIComponent(accessory)}`

                  return (
                    <Card key={index} className="p-6 hover:shadow-md transition-shadow flex flex-col">
                      <div className="flex items-start gap-3 mb-4 flex-grow">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="font-medium">{accessory}</p>
                      </div>
                      <a href={amazonSearchUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          Find on Amazon
                        </Button>
                      </a>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

