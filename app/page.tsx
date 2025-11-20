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
import { BatchResults } from "@/components/home/batch-results"
import type { BatchItem } from "@/lib/types"


type AnalysisState = "idle" | "processing" | "complete"
type AnalysisSelection = "default" | "fitment" | "products" | "all"

export default function Home() {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle")
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisSelection>("default")

  // Cropping State
  const [showCropper, setShowCropper] = useState(false)
  const [croppingItemId, setCroppingItemId] = useState<string | null>(null)
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null)

  // Quality Check State (Global for the dialog)
  const [currentQualityItem, setCurrentQualityItem] = useState<{ id: string, issues: string[] } | null>(null)

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      batchItems.forEach(item => URL.revokeObjectURL(item.preview))
      if (originalImageSrc) URL.revokeObjectURL(originalImageSrc)
    }
  }, []) // Run once on unmount, though technically we should cleanup when items are removed too

  const handleFilesSelect = (files: File[]) => {
    const newItems: BatchItem[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
      result: null,
      detectedProducts: [],
      error: null,
      publicUrl: null,
      qualityIssues: [],
      loadingMessage: null
    }))
    setBatchItems(prev => [...prev, ...newItems])
    setAnalysisState("idle")
  }

  const handleRemoveItem = (id: string) => {
    setBatchItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter(i => i.id !== id)
    })
  }

  const handleClearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    batchItems.forEach(item => URL.revokeObjectURL(item.preview))
    setBatchItems([])
    setAnalysisState("idle")
    setSelectedAnalysis("default")
  }

  const handleCropClick = (id: string) => {
    const item = batchItems.find(i => i.id === id)
    if (item) {
      setCroppingItemId(id)
      setOriginalImageSrc(item.preview) // Using preview as source for now
      setShowCropper(true)
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    if (!croppingItemId) return

    setBatchItems(prev => prev.map(item => {
      if (item.id === croppingItemId) {
        URL.revokeObjectURL(item.preview)
        return {
          ...item,
          file: croppedFile,
          preview: URL.createObjectURL(croppedFile),
          status: "pending", // Reset status if re-cropped
          result: null,
          error: null
        }
      }
      return item
    }))

    // Don't close cropper here, let the dialog handle it or user close it
    // But usually we want to close it after crop
    setShowCropper(false)
    setCroppingItemId(null)
  }

  // --- Analysis Logic ---

  async function uploadImageToSupabase(file: File): Promise<{ url: string | null, error: string | null }> {
    try {
      const response = await createSignedUploadUrl(file.name, file.type)
      if (!response.success) throw new Error(response.error || "Failed to get upload URL")

      const { signedUrl, path } = response.data

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.status}`)

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/vehicle_images/${path}`

      // Verify URL
      const check = await fetch(publicUrl)
      if (check.status === 200) return { url: check.url, error: null }
      return { url: publicUrl, error: null } // Return constructed URL anyway
    } catch (err) {
      return { url: null, error: err instanceof Error ? err.message : String(err) }
    }
  }

  async function processItem(item: BatchItem, analysisType: AnalysisSelection): Promise<BatchItem> {
    // 1. Upload
    let currentItem: BatchItem = { ...item, status: "uploading", progress: 10, loadingMessage: "Uploading..." }
    // We need to update state to reflect this change? 
    // Actually, we'll just return the updated item and let the caller update state.
    // But for long running processes, we might want intermediate updates.
    // For now, let's just do the logic and return the final state of the item.

    // NOTE: In a real app, we'd want to update the UI state *during* this function.
    // I'll use a helper to update the specific item in the batchItems state.
    const updateItem = (updates: Partial<BatchItem>) => {
      setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updates } : i))
      currentItem = { ...currentItem, ...updates }
    }

    updateItem({ status: "uploading", progress: 10, loadingMessage: "Uploading..." })

    const { url, error: uploadError } = await uploadImageToSupabase(item.file)
    if (uploadError || !url) {
      updateItem({ status: "error", error: uploadError || "Upload failed", progress: 0, loadingMessage: null })
      return currentItem
    }

    updateItem({ publicUrl: url, status: "quality_check", progress: 30, loadingMessage: "Checking quality..." })

    // 2. Quality Check
    const qualityResponse = await checkImageQuality(url)
    if (qualityResponse.success) {
      const { isHighQuality, issues } = qualityResponse.data
      if (!isHighQuality) {
        // For batch, maybe we just mark it with issues but proceed? 
        // Or pause? Let's just record issues and proceed for now to avoid blocking the whole batch.
        updateItem({ qualityIssues: issues })
      }
    }

    updateItem({ status: "analyzing", progress: 50, loadingMessage: "Analyzing..." })

    // 3. Analysis
    try {
      let result: AnalysisResults | null = null
      let detectedProducts: DetectedProduct[] = []
      let vehicleDetailsString: string | null = null

      // Fitment
      if (analysisType === "fitment" || analysisType === "all") {
        updateItem({ loadingMessage: "Analyzing fitment..." })
        const fitmentRes = await analyzeVehicleImage(url)
        if (fitmentRes.success) {
          result = fitmentRes.data
          const v = fitmentRes.data.primary
          vehicleDetailsString = `${v.year} ${v.make} ${v.model} ${v.trim}`
        } else {
          throw new Error(fitmentRes.error)
        }
      }

      updateItem({ progress: 70 })

      // Products
      if (analysisType === "products" || analysisType === "all") {
        updateItem({ loadingMessage: "Detecting products..." })
        const detectRes = await detectVisibleProducts(url, vehicleDetailsString)
        if (detectRes.success) {
          const types = detectRes.data
          for (let i = 0; i < types.length; i++) {
            updateItem({ loadingMessage: `Analyzing ${types[i]}...`, progress: 70 + Math.floor((i / types.length) * 25) })
            const details = await refineProductDetails(url, types[i], vehicleDetailsString)
            detectedProducts.push(details)
            // Update intermediate products
            updateItem({ detectedProducts: [...detectedProducts] })
          }
        } else {
          // If product detection fails, do we fail the whole thing? Maybe just log error.
          updateItem({ error: detectRes.error }) // This might overwrite fitment success?
        }
      }

      updateItem({
        status: "complete",
        progress: 100,
        result,
        detectedProducts,
        loadingMessage: null
      })

    } catch (err) {
      updateItem({
        status: "error",
        error: err instanceof Error ? err.message : String(err),
        progress: 0,
        loadingMessage: null
      })
    }

    return currentItem
  }

  const handleStartBatch = async () => {
    setAnalysisState("processing")

    // Process sequentially to avoid rate limits? Or parallel?
    // Let's do sequential for now to be safe with API limits.

    const pendingItems = batchItems.filter(i => i.status === "pending" || i.status === "error")

    for (const item of pendingItems) {
      await processItem(item, selectedAnalysis)
    }

    setAnalysisState("complete")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />

        <UploadZone
          onFilesSelect={handleFilesSelect}
          batchItems={batchItems}
          onRemove={handleRemoveItem}
          onCrop={handleCropClick}
          onClearAll={handleClearAll}
          analysisState={analysisState}
          selectedAnalysis={selectedAnalysis}
          onAnalysisChange={setSelectedAnalysis}
          onStart={handleStartBatch}
        />

        {/* Batch Results Display */}
        {batchItems.length > 0 && (
          <div className="container mx-auto px-4 py-8">
            <BatchResults items={batchItems} />
          </div>
        )}

        <HowItWorks />
        <UseCases />
      </main>

      <QualityWarningDialog
        isOpen={!!currentQualityItem}
        issues={currentQualityItem?.issues || []}
        onCancel={() => setCurrentQualityItem(null)}
        onProceed={() => {
          // Logic to resume item? For now we just auto-proceed in batch mode
          setCurrentQualityItem(null)
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