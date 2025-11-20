"use client"

import { useState, useCallback } from "react"
import {
  createSignedUploadUrl,
  analyzeVehicleImage,
  detectVisibleProducts,
  refineProductDetails,
  checkImageQuality,
  type ImageQualityResult,
} from "@/app/actions"
import { getBrowserClient } from "@/lib/supabase"
import { HeroSection } from "@/components/home/hero-section"
import { UploadZone } from "@/components/home/upload-zone"
import { ResultsDisplay } from "@/components/home/results-display"
import { HowItWorks } from "@/components/home/how-it-works"
import { UseCases } from "@/components/home/use-cases"
import { QualityWarningDialog } from "@/components/home/quality-warning-dialog"

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
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null)
  const [showQualityWarning, setShowQualityWarning] = useState(false)

  const clearAll = () => {
    setUploadedFile(null)
    setPreview(null)
    setResults(null)
    setError(null)
    setPublicImageUrl(null)
    setDetectedProducts(null)
    setDetectedProducts(null)
    setProductError(null)
    setLoadingMessage(null)
    setQualityResult(null)
    setShowQualityWarning(false)
    setAnalysisState("idle")
    setSelectedAnalysis("default")
  }

  const handleFileSelect = (file: File) => {
    clearAll() // Clear everything on new upload
    setUploadedFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

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
    setLoadingMessage("Scanning image for products...")

    try {
      const url = await getOrUploadImage()
      const vehicleDetails = results
        ? `${results.primary.year} ${results.primary.make} ${results.primary.model} ${results.primary.trim}`
        : null

      // Stage 1: Detect Types
      const detectResponse = await detectVisibleProducts(url, vehicleDetails)
      if (!detectResponse.success) {
        throw new Error(detectResponse.error || "Failed to detect products")
      }

      const productTypes = detectResponse.data
      if (productTypes.length === 0) {
        setDetectedProducts([])
        setLoadingMessage(null)
        setAnalysisState("idle")
        return
      }

      setLoadingMessage(`Found: ${productTypes.join(", ")}. Analyzing details...`)

      // Stage 2: Refine Details
      // Initialize with placeholders to show immediate progress if we wanted to render them,
      // but for now we just update the loading message as they complete.

      const refinedProducts: DetectedProduct[] = []

      // Process in parallel but update state? 
      // For simplicity, let's do parallel and wait, but we could update a progress counter.

      const promises = productTypes.map(async (type) => {
        const refined = await refineProductDetails(url, type, vehicleDetails)
        return refined
      })

      const finalProducts = await Promise.all(promises)
      setDetectedProducts(finalProducts)

    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      console.error("[v4] Product error:", msg)
      setProductError(msg)
    } finally {
      setAnalysisState("idle")
      setLoadingMessage(null)
    }
  }

  const handleAnalyzeAll = async () => {
    setAnalysisState("all")
    setError(null)
    setProductError(null)
    setLoadingMessage("Analyzing vehicle fitment...")

    try {
      const url = await getOrUploadImage()

      // 1. Fitment
      const fitmentResponse = await analyzeVehicleImage(url)
      if (!fitmentResponse.success) {
        throw new Error(fitmentResponse.error || "Failed to analyze vehicle")
      }
      setResults(fitmentResponse.data)

      // 2. Products
      setLoadingMessage("Scanning image for products...")
      const vehicleDetails = `${fitmentResponse.data.primary.year} ${fitmentResponse.data.primary.make} ${fitmentResponse.data.primary.model} ${fitmentResponse.data.primary.trim}`

      const detectResponse = await detectVisibleProducts(url, vehicleDetails)
      if (!detectResponse.success) {
        throw new Error(detectResponse.error || "Failed to detect products")
      }

      const productTypes = detectResponse.data
      if (productTypes.length === 0) {
        setDetectedProducts([])
        return
      }

      setLoadingMessage(`Found: ${productTypes.join(", ")}. Analyzing details...`)

      const promises = productTypes.map(async (type) => {
        const refined = await refineProductDetails(url, type, vehicleDetails)
        return refined
      })

      const finalProducts = await Promise.all(promises)
      setDetectedProducts(finalProducts)

    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      console.error("[v4] 'All' error:", msg)
      setError(msg)
    } finally {
      setAnalysisState("idle")
      setLoadingMessage(null)
    }
  }

  // --- "Start" Button Handler ---
  const handleSend = async () => {
    if (!uploadedFile && !publicImageUrl) return

    // If we already have a public URL (re-running analysis), just proceed
    if (publicImageUrl && !uploadedFile) {
      proceedWithAnalysis()
      return
    }

    // If we have a new file, upload it first, then check quality
    setAnalysisState(selectedAnalysis === "products" ? "products" : selectedAnalysis === "all" ? "all" : "fitment")
    setLoadingMessage("Checking image quality...")

    try {
      const url = await getOrUploadImage()

      // Check Quality
      const qualityResponse = await checkImageQuality(url)
      if (qualityResponse.success) {
        const { isHighQuality, issues } = qualityResponse.data
        if (!isHighQuality) {
          setQualityResult(qualityResponse.data)
          setShowQualityWarning(true)
          setLoadingMessage(null) // Stop loading to show dialog
          return // Stop here, wait for user input
        }
      }

      // If quality is good, proceed
      proceedWithAnalysis()

    } catch (err) {
      console.error("Error during setup:", err)
      setError("Failed to prepare image for analysis")
      setAnalysisState("idle")
      setLoadingMessage(null)
    }
  }

  const proceedWithAnalysis = () => {
    setShowQualityWarning(false)
    // Reset loading message based on analysis type
    if (selectedAnalysis === "fitment") {
      handleAnalyzeFitment()
    } else if (selectedAnalysis === "products") {
      handleDetectProducts()
    } else if (selectedAnalysis === "all") {
      handleAnalyzeAll()
    }
  }

  return (
    <div className="flex flex-col">
      <HeroSection />

      <UploadZone
        onFileSelect={handleFileSelect}
        preview={preview}
        onClear={clearPreview}
        analysisState={analysisState}
        selectedAnalysis={selectedAnalysis}
        onAnalysisChange={setSelectedAnalysis}
        onStart={handleSend}
        uploadedFile={uploadedFile}
      />

      <ResultsDisplay
        analysisState={analysisState}
        results={results}
        detectedProducts={detectedProducts}
        error={error}
        productError={productError}
        loadingMessage={loadingMessage}
        onAnalyzeFitment={handleAnalyzeFitment}
        onDetectProducts={handleDetectProducts}
      />

      <QualityWarningDialog
        isOpen={showQualityWarning}
        issues={qualityResult?.issues || []}
        onCancel={() => {
          setShowQualityWarning(false)
          setAnalysisState("idle")
          setLoadingMessage(null)
        }}
        onProceed={proceedWithAnalysis}
      />
      <HowItWorks />

      <UseCases />
    </div>
  )
}