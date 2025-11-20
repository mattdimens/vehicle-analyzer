"use client"

import { useState, useEffect } from "react"
import {
  createSignedUploadUrl,
  analyzeVehicleImage,
  detectVisibleProducts,
  refineProductDetails,
  checkImageQuality,
  type ImageQualityResult,
  type AnalysisResults,
  type DetectedProduct
} from "./actions"
import { HeroSection } from "@/components/home/hero-section"
import { UploadZone } from "@/components/home/upload-zone"
import { ResultsDisplay } from "@/components/home/results-display"
import { HowItWorks } from "@/components/home/how-it-works"
import { UseCases } from "@/components/home/use-cases"
import { QualityWarningDialog } from "@/components/home/quality-warning-dialog"
import { ImageCropperDialog } from "@/components/home/image-cropper-dialog"



type AnalysisState = "idle" | "fitment" | "products" | "all"
type AnalysisSelection = "default" | "fitment" | "products" | "all"

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle")
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisSelection>("default")
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [detectedProducts, setDetectedProducts] = useState<DetectedProduct[]>([])
  const [publicImageUrl, setPublicImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState<string | null>("")
  const [progress, setProgress] = useState<number>(0)

  // Quality Check State
  const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null)
  const [showQualityWarning, setShowQualityWarning] = useState(false)

  // Cropping State
  const [showCropper, setShowCropper] = useState(false)
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null)

  // Cleanup preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
      if (originalImageSrc && originalImageSrc !== preview) URL.revokeObjectURL(originalImageSrc)
    }
  }, [preview, originalImageSrc])

  const handleFileSelect = (file: File) => {
    setUploadedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setOriginalImageSrc(objectUrl) // Keep track of the original for cropping

    // Reset states
    setResults(null)
    setDetectedProducts([])
    setPublicImageUrl(null)
    setError(null)
    setProductError(null)
    setAnalysisState("idle")
    setSelectedAnalysis("default")
    setLoadingMessage("")
    setProgress(0)
    setQualityResult(null)
    setShowQualityWarning(false)
  }

  const handleCropComplete = (croppedFile: File) => {
    // Replace the uploaded file with the cropped version
    setUploadedFile(croppedFile)

    // Update preview
    if (preview) URL.revokeObjectURL(preview)
    const objectUrl = URL.createObjectURL(croppedFile)
    setPreview(objectUrl)

    // We don't reset originalImageSrc so the user can re-crop from the original if needed
  }

  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setUploadedFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setOriginalImageSrc(null)
    setResults(null)
    setDetectedProducts([])
    setPublicImageUrl(null)
    setError(null)
    setProductError(null)
    setAnalysisState("idle")
    setSelectedAnalysis("default")
    setLoadingMessage("")
    setProgress(0)
    setQualityResult(null)
    setShowQualityWarning(false)
  }

  async function uploadImageToSupabase(file: File): Promise<string | null> {
    try {
      setLoadingMessage("Uploading image...")
      setProgress(10)

      console.log("[Upload] Starting upload for:", file.name, file.type)
      const response = await createSignedUploadUrl(file.name, file.type)
      console.log("[Upload] Signed URL response:", response)

      if (!response.success) {
        console.error("[Upload] Failed to get signed URL:", response.error)
        throw new Error(response.error || "Failed to get upload URL")
      }
      const { signedUrl, path } = response.data
      console.log("[Upload] Got signed URL, path:", path)

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })
      console.log("[Upload] Upload response status:", uploadResponse.status)

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error("[Upload] Upload failed:", uploadResponse.status, errorText)
        throw new Error(`Failed to upload image to storage: ${uploadResponse.status}`)
      }

      const publicUrl = `https://vjscvjukmkoqhwwjndhi.supabase.co/storage/v1/object/public/vehicle-images/${path}`
      console.log("[Upload] Checking public URL:", publicUrl)

      const publicUrlResponse = await fetch(publicUrl)
      console.log("[Upload] Public URL check status:", publicUrlResponse.status)

      if (publicUrlResponse.status === 200) {
        console.log("[Upload] Success! Returning URL:", publicUrlResponse.url)
        return publicUrlResponse.url
      }

      console.log("[Upload] Public URL check failed, returning constructed URL")
      return publicUrl
    } catch (err) {
      console.error("[Upload] Error occurred:", err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Failed to upload image: ${errorMessage}`)
      setAnalysisState("idle")
      return null
    }
  }

  async function handleAnalyzeFitment(imageUrl: string) {
    setLoadingMessage("Analyzing vehicle fitment...")
    setProgress(30)
    const result = await analyzeVehicleImage(imageUrl)
    if (result.success) {
      setResults(result.data)
      setProgress(100)
    } else {
      setError(result.error)
    }
  }

  async function handleDetectProducts(imageUrl: string, vehicleDetails: string | null) {
    setLoadingMessage("Scanning for products...")
    setProgress(40)

    // Step 1: Detect visible products
    const detectionResult = await detectVisibleProducts(imageUrl, vehicleDetails)

    if (!detectionResult.success) {
      setProductError(detectionResult.error)
      return
    }

    const productTypes = detectionResult.data
    if (productTypes.length === 0) {
      setLoadingMessage("No products found.")
      setProgress(100)
      return
    }

    // Step 2: Refine details for each product
    const totalProducts = productTypes.length
    const refinedProducts: DetectedProduct[] = []

    for (let i = 0; i < totalProducts; i++) {
      const type = productTypes[i]
      setLoadingMessage(`Analyzing ${type} details (${i + 1}/${totalProducts})...`)
      // Calculate progress based on how many products we've processed
      // Map the remaining 60% (40 -> 100) to the product refinement steps
      const stepProgress = 40 + Math.floor(((i + 1) / totalProducts) * 60)
      setProgress(stepProgress)

      const productDetails = await refineProductDetails(imageUrl, type, vehicleDetails)
      refinedProducts.push(productDetails)
      // Update state incrementally so user sees results appearing
      setDetectedProducts(prev => [...prev, productDetails])
    }

    setProgress(100)
  }

  async function handleAnalyzeAll(imageUrl: string) {
    // 1. Fitment
    setLoadingMessage("Analyzing vehicle fitment...")
    setProgress(20)
    const fitmentResult = await analyzeVehicleImage(imageUrl)

    let vehicleDetailsString: string | null = null

    if (fitmentResult.success) {
      setResults(fitmentResult.data)
      const v = fitmentResult.data.primary
      vehicleDetailsString = `${v.year} ${v.make} ${v.model} ${v.trim}`
    } else {
      setError(fitmentResult.error)
    }

    // 2. Products
    await handleDetectProducts(imageUrl, vehicleDetailsString)
  }

  async function proceedWithAnalysis(imageUrl: string) {
    setShowQualityWarning(false)

    if (selectedAnalysis === "fitment") {
      setAnalysisState("fitment")
      await handleAnalyzeFitment(imageUrl)
    } else if (selectedAnalysis === "products") {
      setAnalysisState("products")
      await handleDetectProducts(imageUrl, null)
    } else {
      setAnalysisState("all")
      await handleAnalyzeAll(imageUrl)
    }

    setAnalysisState("idle")
    setLoadingMessage(null)
  }

  const handleSend = async () => {
    if (!uploadedFile) return

    setAnalysisState(selectedAnalysis === "all" ? "all" : selectedAnalysis === "fitment" ? "fitment" : "products")
    setError(null)
    setProductError(null)
    setResults(null)
    setDetectedProducts([])

    // 1. Upload
    const imageUrl = await uploadImageToSupabase(uploadedFile)
    if (!imageUrl) return
    setPublicImageUrl(imageUrl)

    // 2. Quality Check
    setLoadingMessage("Checking image quality...")
    // Check Quality
    const qualityResponse = await checkImageQuality(imageUrl)
    if (qualityResponse.success) {
      const { isHighQuality, issues } = qualityResponse.data
      if (!isHighQuality) {
        setQualityResult(qualityResponse.data)
        setShowQualityWarning(true)
        setLoadingMessage(null) // Stop loading to show dialog
        return // Stop here, wait for user input
      }
    }

    // 3. Proceed if quality is good
    await proceedWithAnalysis(imageUrl)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />

        <UploadZone
          onFileSelect={handleFileSelect}
          preview={preview}
          onClear={clearAll}
          analysisState={analysisState}
          selectedAnalysis={selectedAnalysis}
          onAnalysisChange={setSelectedAnalysis}
          onStart={handleSend}
          uploadedFile={uploadedFile}
          onCrop={() => setShowCropper(true)}
        />

        <ResultsDisplay
          results={results}
          detectedProducts={detectedProducts}
          error={error}
          productError={productError}
          loadingMessage={loadingMessage}
          progress={progress}
        />

        <HowItWorks />
        <UseCases />
      </main>

      <QualityWarningDialog
        isOpen={showQualityWarning}
        issues={qualityResult?.issues || []}
        onCancel={() => {
          setShowQualityWarning(false)
          setAnalysisState("idle")
          setLoadingMessage(null)
        }}
        onProceed={() => {
          if (publicImageUrl) proceedWithAnalysis(publicImageUrl)
        }}
      />

      <ImageCropperDialog
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        imageSrc={originalImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  )
}