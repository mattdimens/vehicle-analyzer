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
} from "@/app/actions"
import { HeroSection } from "@/components/home/hero-section"
import { UploadZone } from "@/components/home/upload-zone"
import { ResultsDisplay } from "@/components/home/results-display"
import { HowItWorks } from "@/components/home/how-it-works"
import { ProductCategories } from "@/components/home/product-categories"
import { UseCases } from "@/components/home/use-cases"
import { QualityWarningDialog } from "@/components/home/quality-warning-dialog"
import { ImageCropperDialog } from "@/components/home/image-cropper-dialog"
import { BatchResults } from "@/components/home/batch-results"
import type { BatchItem } from "@/lib/types"

type AnalysisState = "idle" | "processing" | "complete"
type AnalysisSelection = "default" | "fitment" | "products" | "all"

interface VehicleAnalyzerProps {
    title?: string
    description?: string
    promptContext?: string
    showCategories?: boolean
    detectedProductsTitle?: string
}

export function VehicleAnalyzer({ title, description, promptContext, showCategories = false, detectedProductsTitle }: VehicleAnalyzerProps) {
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
            batchItems.forEach(item => {
                item.images.forEach(img => URL.revokeObjectURL(img.preview))
            })
            if (originalImageSrc) URL.revokeObjectURL(originalImageSrc)
        }
    }, []) // Run once on unmount

    const handleFilesSelect = (files: File[]) => {
        // Create ONE item for all the dropped files (User intention: 1 Drop = 1 Vehicle)
        const newItem: BatchItem = {
            id: Math.random().toString(36).substring(7),
            images: files.map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                preview: URL.createObjectURL(file), // Create preview for each file
                publicUrl: null
            })),
            status: "pending",
            progress: 0,
            result: null,
            detectedProducts: [],
            error: null,
            qualityIssues: [],
            loadingMessage: null
        }

        setBatchItems(prev => [...prev, newItem])
        setAnalysisState("idle")
    }

    const handleAddImageToItem = (itemId: string, files: File[]) => {
        setBatchItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const newImages = files.map(file => ({
                    id: Math.random().toString(36).substring(7),
                    file,
                    preview: URL.createObjectURL(file),
                    publicUrl: null
                }))
                return {
                    ...item,
                    images: [...item.images, ...newImages],
                    status: "pending" // Reset status to allow re-analysis
                }
            }
            return item
        }))
    }

    const handleSplitItem = (itemId: string) => {
        setBatchItems(prev => {
            const itemToSplit = prev.find(i => i.id === itemId)
            if (!itemToSplit) return prev

            // Remove the original item
            const others = prev.filter(i => i.id !== itemId)

            // Create new items for each image in the split item
            const splitItems: BatchItem[] = itemToSplit.images.map(img => ({
                id: Math.random().toString(36).substring(7),
                images: [img], // Keep the image object as is (with preview)
                status: "pending",
                progress: 0,
                result: null,
                detectedProducts: [],
                error: null,
                qualityIssues: [],
                loadingMessage: null
            }))

            return [...others, ...splitItems]
        })
    }

    const handleRemoveImageFromItem = (itemId: string, imageId: string) => {
        setBatchItems(prev => {
            return prev.map(item => {
                if (item.id !== itemId) return item

                // Filter out the image
                const targetImage = item.images.find(img => img.id === imageId)
                if (targetImage) {
                    URL.revokeObjectURL(targetImage.preview)
                }
                const newImages = item.images.filter(img => img.id !== imageId)

                // If no images left, we filter out the item entirely later
                if (newImages.length === 0) return null

                return {
                    ...item,
                    images: newImages,
                    status: "pending" // Reset status
                }
            }).filter(Boolean) as BatchItem[]
        })
    }

    const handleMergeItems = (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return

        setBatchItems(prev => {
            const sourceItem = prev.find(i => i.id === sourceId)
            const targetItem = prev.find(i => i.id === targetId)

            if (!sourceItem || !targetItem) return prev

            // Merge images from source to target
            const mergedImages = [...targetItem.images, ...sourceItem.images]

            // Return new list: target updated, source removed
            return prev.map(item => {
                if (item.id === targetId) {
                    return {
                        ...item,
                        images: mergedImages,
                        status: "pending" as const // Reset status for re-analysis
                    }
                }
                return item
            }).filter(item => item.id !== sourceId)
        })
    }

    const handleRemoveItem = (id: string) => {
        setBatchItems(prev => {
            const item = prev.find(i => i.id === id)
            if (item) {
                item.images.forEach(img => URL.revokeObjectURL(img.preview))
            }
            return prev.filter(i => i.id !== id)
        })
    }

    const handleClearAll = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        batchItems.forEach(item => {
            item.images.forEach(img => URL.revokeObjectURL(img.preview))
        })
        setBatchItems([])
        setAnalysisState("idle")
        setSelectedAnalysis("default")
    }

    // For cropping, we need to know WHICH image in WHICH item is being cropped.
    // Ideally, we'd pass both IDs. For now, let's assume `croppingItemId` is the ITEM id, 
    // but we also need the IMAGE id.
    // Updated strategy: `croppingItemId` will store `${itemId}|${imageId}`

    const handleCropClick = (itemId: string, imageId: string) => {
        const item = batchItems.find(i => i.id === itemId)
        const image = item?.images.find(img => img.id === imageId)

        if (item && image) {
            setCroppingItemId(`${itemId}|${imageId}`)
            setOriginalImageSrc(image.preview)
            setShowCropper(true)
        }
    }

    const handleCropComplete = (croppedFile: File) => {
        if (!croppingItemId) return

        const [itemId, imageId] = croppingItemId.split('|')

        setBatchItems(prev => prev.map(item => {
            if (item.id === itemId) {
                // Update specific image in the item
                const updatedImages = item.images.map(img => {
                    if (img.id === imageId) {
                        URL.revokeObjectURL(img.preview)
                        return {
                            ...img,
                            file: croppedFile,
                            preview: URL.createObjectURL(croppedFile),
                            // If we re-crop, we might need to reset publicUrl if it was already uploaded?
                            // Yes, strictly speaking. But typically we only crop before processing.
                            publicUrl: null
                        }
                    }
                    return img
                })

                return {
                    ...item,
                    images: updatedImages,
                    status: "pending", // Reset item status if user edits an image
                    result: null,
                    error: null
                }
            }
            return item
        }))

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
        // 1. Upload Loop
        let currentItem: BatchItem = { ...item, status: "uploading", progress: 0, loadingMessage: "Uploading images..." }

        const updateItem = (updates: Partial<BatchItem>) => {
            setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updates } : i))
            currentItem = { ...currentItem, ...updates }
        }

        updateItem({ status: "uploading", progress: 5 })

        const uploadedImages: { id: string, file: File, preview: string, publicUrl: string | null }[] = []

        // Upload each image
        let uploadedCount = 0
        for (const img of item.images) {
            // Skip if already uploaded? For now, re-upload to be safe or if retry logic needs it.
            // Actually, if publicUrl exists, we could skip.
            if (img.publicUrl) {
                uploadedImages.push(img)
                uploadedCount++
                continue
            }

            const { url, error: uploadError } = await uploadImageToSupabase(img.file)
            if (uploadError || !url) {
                updateItem({ status: "error", error: `Failed to upload image ${img.file.name}`, progress: 0, loadingMessage: null })
                return currentItem
            }

            uploadedImages.push({ ...img, publicUrl: url })
            uploadedCount++
            updateItem({ progress: 5 + Math.floor((uploadedCount / item.images.length) * 20) }) // Upload is 5-25%
        }

        // Update item with uploaded URLs
        // We update the state to preserve the publicUrls
        updateItem({ images: uploadedImages })

        const publicUrls = uploadedImages.map(img => img.publicUrl!).filter(Boolean)

        if (publicUrls.length === 0) {
            updateItem({ status: "error", error: "No images uploaded successfully", progress: 0 })
            return currentItem
        }

        updateItem({ status: "quality_check", progress: 30, loadingMessage: "Checking image quality..." })

        // 2. Quality Check (Batched)
        const qualityResponse = await checkImageQuality(publicUrls)
        if (qualityResponse.success) {
            const { isHighQuality, issues } = qualityResponse.data
            if (!isHighQuality) {
                updateItem({ qualityIssues: issues })
            }
        }

        updateItem({ status: "analyzing", progress: 40, loadingMessage: "Analyzing vehicle..." })

        // 3. Analysis
        try {
            let result: AnalysisResults | null = null
            let detectedProducts: DetectedProduct[] = []
            let vehicleDetailsString: string | null = null

            // Fitment
            if (analysisType === "fitment" || analysisType === "all") {
                updateItem({ loadingMessage: "Analyzing vehicle details..." })
                // PASS PROMPT CONTEXT HERE
                const fitmentRes = await analyzeVehicleImage(publicUrls, promptContext)
                if (fitmentRes.success) {
                    result = fitmentRes.data
                    const v = fitmentRes.data.primary
                    vehicleDetailsString = `${v.year} ${v.make} ${v.model} ${v.trim}`
                } else {
                    throw new Error(fitmentRes.error)
                }
            }

            updateItem({ progress: 60 })

            // Products
            if (analysisType === "products" || analysisType === "all") {
                updateItem({ loadingMessage: "Detecting products..." })
                // PASS PROMPT CONTEXT HERE
                const detectRes = await detectVisibleProducts(publicUrls, vehicleDetailsString, promptContext)
                if (detectRes.success) {
                    const types = detectRes.data
                    for (let i = 0; i < types.length; i++) {
                        updateItem({ loadingMessage: `Analyzing ${types[i]}...`, progress: 60 + Math.floor((i / types.length) * 35) })
                        // Maybe pass context here too if needed? For now just types.
                        const details = await refineProductDetails(publicUrls, types[i], vehicleDetailsString, promptContext)
                        detectedProducts.push(details)
                        // Update intermediate products
                        updateItem({ detectedProducts: [...detectedProducts] })
                    }
                } else {
                    updateItem({ error: detectRes.error })
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

        // Scroll to results
        const resultsElement = document.getElementById("results")
        if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: "smooth" })
        }

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
                <div className="bg-[#003223]">
                    <HeroSection title={title} description={description} />

                    <div id="upload-zone" className="scroll-mt-20">
                        <UploadZone
                            onFilesSelect={handleFilesSelect}
                            batchItems={batchItems}
                            onRemove={handleRemoveItem}
                            onRemoveImage={handleRemoveImageFromItem}
                            onCrop={handleCropClick}
                            onAddImages={handleAddImageToItem}
                            onSplit={handleSplitItem}
                            onMerge={handleMergeItems}
                            onClearAll={handleClearAll}
                            analysisState={analysisState}
                            selectedAnalysis={selectedAnalysis}
                            onAnalysisChange={setSelectedAnalysis}
                            onStart={handleStartBatch}
                        />
                    </div>
                </div>

                {/* Batch Results Display */}
                {batchItems.length > 0 && (
                    <section className="bg-white w-full py-12">
                        <div className="container mx-auto px-4">
                            <BatchResults items={batchItems} detectedProductsTitle={detectedProductsTitle} />
                        </div>
                    </section>
                )}

                <HowItWorks />

                {/* Visual Separator */}
                {showCategories && <div className="w-full h-px bg-black" />}

                {showCategories && <ProductCategories />}
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
