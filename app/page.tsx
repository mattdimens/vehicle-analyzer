"use client"

import { useState, useCallback } from "react"
import {
  createSignedUploadUrl,
  analyzeVehicleImage,
  analyzeProductsOnVehicle,
} from "@/app/actions"
import { getBrowserClient } from "@/lib/supabase"
import { HeroSection } from "@/components/home/hero-section"
import { UploadZone } from "@/components/home/upload-zone"
import { ResultsDisplay } from "@/components/home/results-display"
import { HowItWorks } from "@/components/home/how-it-works"
import { UseCases } from "@/components/home/use-cases"

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
        onAnalyzeFitment={handleAnalyzeFitment}
        onDetectProducts={handleDetectProducts}
      />

      <HowItWorks />

      <UseCases />
    </div>
  )
}