"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
    createSignedUploadUrl,
    detectVisibleProducts,
    refineProductDetails,
    checkImageQuality,
    identifyPart,
    type ImageQualityResult,
    type AnalysisResults,
    type DetectedProduct,
    type PartIdentification
} from "@/app/actions"
import { HeroSection } from "@/components/home/hero-section"
import { UploadZone } from "@/components/home/upload-zone"
import { ResultsDisplay } from "@/components/home/results-display"
import { HowItWorks, type HowItWorksStep } from "@/components/home/how-it-works"
import { ProductCategories } from "@/components/home/product-categories"
import { UseCases, type UseCaseCard } from "@/components/home/use-cases"
import { StatsBar } from "@/components/home/stats-bar"
import { BreadcrumbNav, type BreadcrumbItem } from "@/components/ui/breadcrumb-nav"
import { BatchResults } from "@/components/home/batch-results"
import { trackEvent } from "@/lib/analytics"
import type { BatchItem } from "@/lib/types"

// Dynamic imports for dialogs — only loaded when opened (P-02)
const QualityWarningDialog = dynamic(
    () => import("@/components/home/quality-warning-dialog").then(mod => ({ default: mod.QualityWarningDialog })),
    { ssr: false }
)
const ImageCropperDialog = dynamic(
    () => import("@/components/home/image-cropper-dialog").then(mod => ({ default: mod.ImageCropperDialog })),
    { ssr: false }
)

type AnalysisState = "idle" | "processing" | "complete"
type AnalysisSelection = "default" | "fitment" | "products" | "all"

export type AnalysisMode = "vehicle" | "part"

interface VehicleAnalyzerProps {
    title?: string
    description?: string
    promptContext?: string
    showCategories?: boolean
    detectedProductsTitle?: string
    analysisMode?: AnalysisMode
    howItWorksSteps?: [HowItWorksStep, HowItWorksStep, HowItWorksStep]
    howItWorksHeading?: React.ReactNode
    useCaseCards?: UseCaseCard[]
    useCaseHeading?: string
    useCaseSubtitle?: string
    categoryLabel?: string
    educationalContent?: React.ReactNode
    faqContent?: React.ReactNode
    breadcrumbs?: BreadcrumbItem[]
    relatedContent?: React.ReactNode
}

export function VehicleAnalyzer({ title, description, promptContext, showCategories = false, detectedProductsTitle, analysisMode: analysisModeProp = "vehicle", howItWorksSteps, howItWorksHeading, useCaseCards, useCaseHeading, useCaseSubtitle, categoryLabel, educationalContent, faqContent, breadcrumbs, relatedContent }: VehicleAnalyzerProps) {
    const [batchItems, setBatchItems] = useState<BatchItem[]>([])
    const [analysisState, setAnalysisState] = useState<AnalysisState>("idle")
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisSelection>(showCategories || categoryLabel ? "all" : "default")
    const [activeMode, setActiveMode] = useState<AnalysisMode>(analysisModeProp)

    // On the homepage, mode is controlled by cards; on sub-pages, it's the prop
    const analysisMode = showCategories ? activeMode : analysisModeProp

    const handleModeSwitch = useCallback((mode: AnalysisMode) => {
        if (mode === activeMode) return
        setActiveMode(mode)
        // Reset state when switching modes
        setBatchItems([])
        setAnalysisState("idle")
        setSelectedAnalysis(mode === "part" ? "all" : "all")

        // Smooth scroll to the upload zone after state updates
        setTimeout(() => {
            const uploadTarget = document.getElementById("upload-target")
            if (uploadTarget) {
                uploadTarget.scrollIntoView({ behavior: "smooth", block: "start" })
            }
        }, 100)
    }, [activeMode])

    // Cropping State
    const [showCropper, setShowCropper] = useState(false)
    const [croppingItemId, setCroppingItemId] = useState<string | null>(null)
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null)

    // Quality Check State (Global for the dialog)
    const [currentQualityItem, setCurrentQualityItem] = useState<{ id: string, issues: string[] } | null>(null)

    // Track created object URLs for cleanup (P-05 — avoid stale closure)
    const createdUrlsRef = useRef<string[]>([])

    // Cleanup preview URLs
    useEffect(() => {
        return () => {
            createdUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
        }
    }, []) // Run once on unmount

    const handleFilesSelect = (files: File[]) => {
        // Create ONE item for all the dropped files (User intention: 1 Drop = 1 Vehicle)
        const previews = files.map(file => {
            const url = URL.createObjectURL(file)
            createdUrlsRef.current.push(url) // Track for cleanup (P-05)
            return { id: Math.random().toString(36).substring(7), file, preview: url, publicUrl: null }
        })
        const newItem: BatchItem = {
            id: Math.random().toString(36).substring(7),
            images: previews,
            status: "pending",
            progress: 0,
            result: null,
            detectedProducts: [],
            partIdentification: null,
            error: null,
            qualityIssues: [],
            loadingMessage: null
        }

        trackEvent('upload_image', { file_count: files.length })
        setBatchItems(prev => [...prev, newItem])
        setAnalysisState("idle")
    }

    const handleAddImageToItem = (itemId: string, files: File[]) => {
        setBatchItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const newImages = files.map(file => {
                    const url = URL.createObjectURL(file)
                    createdUrlsRef.current.push(url)
                    return { id: Math.random().toString(36).substring(7), file, preview: url, publicUrl: null }
                })
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
                partIdentification: null,
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

        updateItem({ status: "analyzing", progress: 40, loadingMessage: analysisMode === "part" ? "Identifying part..." : "Analyzing vehicle..." })

        // 3. Analysis
        try {
            if (analysisMode === "part") {
                // --- Part Identification Mode ---
                updateItem({ loadingMessage: "AI is identifying your part...", progress: 50 })
                const partRes = await identifyPart(publicUrls[0])
                if (!partRes.success) throw new Error(partRes.error)

                updateItem({
                    status: "complete",
                    progress: 100,
                    partIdentification: partRes.data,
                    loadingMessage: null
                })
            } else {
                // --- Vehicle Analysis Mode ---
                let result: AnalysisResults | null = null
                let detectedProducts: DetectedProduct[] = []
                let vehicleDetailsString: string | null = null

                // Fitment
                if (analysisType === "fitment" || analysisType === "all") {
                    updateItem({ loadingMessage: "Analyzing vehicle details..." })
                    // Call the /api/analyze route (upgraded @google/genai SDK + cascading models)
                    const analyzeResponse = await fetch('/api/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageUrls: publicUrls, promptContext }),
                    })
                    const fitmentRes = await analyzeResponse.json()
                    if (fitmentRes.success) {
                        result = fitmentRes.data as AnalysisResults
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
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            trackEvent('analysis_error', { error_message: errorMsg })
            updateItem({
                status: "error",
                error: errorMsg,
                progress: 0,
                loadingMessage: null
            })
        }

        return currentItem
    }

    const handleReset = () => {
        setBatchItems([])
        setAnalysisState("idle")
        setSelectedAnalysis("default")
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleStartBatch = async () => {
        setAnalysisState("processing")
        trackEvent('start_analysis', { analysis_type: selectedAnalysis, item_count: batchItems.length })

        // Scroll to results
        setTimeout(() => {
            const resultsElement = document.getElementById("analysis-results")
            if (resultsElement) {
                resultsElement.scrollIntoView({ behavior: "smooth", block: "start" })
            }
        }, 100)

        // Process sequentially to avoid rate limits? Or parallel?
        // Let's do sequential for now to be safe with API limits.

        const pendingItems = batchItems.filter(i => i.status === "pending" || i.status === "error")

        for (const item of pendingItems) {
            await processItem(item, selectedAnalysis)
        }

        trackEvent('analysis_complete', { item_count: pendingItems.length })
        setAnalysisState("complete")
    }

    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">
                <div className="bg-[#003223]">
                    <HeroSection title={title} description={description} />
                    {breadcrumbs && <BreadcrumbNav items={breadcrumbs} />}

                    <div id="upload-zone" className="scroll-mt-20">
                        {/* Homepage Mode Selector Cards */}
                        {showCategories && (
                            <div className="container mx-auto px-4 mb-6">
                                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                                    <button
                                        type="button"
                                        onClick={() => handleModeSwitch("vehicle")}
                                        className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 md:p-8 transition-all duration-200 bg-white/5 backdrop-blur-sm hover:bg-white/10 ${analysisMode === "vehicle"
                                            ? "border-orange-400 shadow-lg shadow-orange-400/20"
                                            : "border-white/20 hover:border-white/40"
                                            }`}
                                    >
                                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${analysisMode === "vehicle" ? "bg-orange-400/20 text-orange-300" : "bg-white/10 text-white/70 group-hover:bg-white/15"
                                            }`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-2-2.2-3.3C13 5.6 12 5 10.8 5H5.6c-.8 0-1.5.5-1.8 1.2L2 11c-.5 1.1-.2 2.3.7 3" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                                        </div>
                                        <div className="text-center">
                                            <h3 className={`font-heading text-base md:text-lg font-bold ${analysisMode === "vehicle" ? "text-orange-300" : "text-white"
                                                }`}>Identify My Vehicle</h3>
                                            <p className="text-xs md:text-sm text-white/60 mt-1">Upload a vehicle photo to find fitment and compatible parts.</p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleModeSwitch("part")}
                                        className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 md:p-8 transition-all duration-200 bg-white/5 backdrop-blur-sm hover:bg-white/10 ${analysisMode === "part"
                                            ? "border-orange-400 shadow-lg shadow-orange-400/20"
                                            : "border-white/20 hover:border-white/40"
                                            }`}
                                    >
                                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${analysisMode === "part" ? "bg-orange-400/20 text-orange-300" : "bg-white/10 text-white/70 group-hover:bg-white/15"
                                            }`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" /><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                                        </div>
                                        <div className="text-center">
                                            <h3 className={`font-heading text-base md:text-lg font-bold ${analysisMode === "part" ? "text-orange-300" : "text-white"
                                                }`}>Identify a Part</h3>
                                            <p className="text-xs md:text-sm text-white/60 mt-1">Upload a photo of any car part to learn what it is.</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div id="upload-target" className="scroll-mt-24">
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
                                onReset={handleReset}
                                analysisMode={analysisMode}
                                isHomepage={showCategories}
                                categoryLabel={categoryLabel}
                            />
                        </div>
                    </div>
                </div>

                {/* Batch Results Display */}
                {batchItems.length > 0 && (
                    <section id="analysis-results" className="bg-white w-full py-12">
                        <div className="container mx-auto px-4">
                            <BatchResults items={batchItems} detectedProductsTitle={detectedProductsTitle} analysisMode={analysisMode} />
                        </div>
                    </section>
                )}

                {educationalContent}

                <StatsBar />

                <HowItWorks steps={howItWorksSteps} heading={howItWorksHeading} />

                {/* Visual Separator */}
                {showCategories && <div className="w-full h-px bg-[#E0E0E0]" />}

                {showCategories && <ProductCategories />}

                {/* Cross-link: Homepage → Part Identifier */}
                {showCategories && (
                    <div className="w-full bg-white pb-8">
                        <div className="container max-w-6xl text-center">
                            <p className="text-muted-foreground">
                                Need to identify an individual part instead?{" "}
                                <Link href="/part-identifier" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">
                                    Identify any car part from a photo with our Visual Part Identifier
                                </Link>
                            </p>
                        </div>
                    </div>
                )}

                {/* Cross-link: Part Identifier → Vehicle Analyzer */}
                {analysisMode === "part" && (
                    <div className="w-full bg-white py-8">
                        <div className="container max-w-6xl text-center">
                            <p className="text-muted-foreground">
                                Looking to identify your full vehicle fitment instead?{" "}
                                <Link href="/#upload-zone" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">
                                    Analyze your vehicle's year, make, model, and compatible accessories
                                </Link>
                            </p>
                        </div>
                    </div>
                )}

                <UseCases cards={useCaseCards} heading={useCaseHeading} subtitle={useCaseSubtitle} />
                {faqContent}
                {relatedContent}
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
