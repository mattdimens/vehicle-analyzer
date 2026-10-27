"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    createSignedUploadUrl,
    type AnalysisResults,
    type DetectedProduct,
} from "@/app/actions"
import { HeroSection } from "@/components/home/hero-section"
import { HeroDualEntry } from "@/components/home/hero-dual-entry"
import { SampleResultPreview } from "@/components/home/sample-result-preview"
import { UploadZone } from "@/components/home/upload-zone"
import { HeroEyebrow } from "@/components/results/sample-result-card"

import { HowItWorks, type HowItWorksStep } from "@/components/home/how-it-works"
import { ProductCategories } from "@/components/home/product-categories"
import { BrowseByVehicle } from "@/components/home/browse-by-vehicle"
import { TrustStrip } from "@/components/home/trust-strip"
import { CatalogStatsBar } from "@/components/home/catalog-stats-bar"
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure"
import { UseCases, type UseCaseCard } from "@/components/home/use-cases"
import { BreadcrumbNav, type BreadcrumbItem } from "@/components/ui/breadcrumb-nav"
import { SaveToGarageCTA } from "@/components/ui/save-to-garage-cta"
import { BatchResults } from "@/components/home/batch-results"
import { trackEvent, getPlatform } from "@/lib/analytics"
import { getConfidenceBand } from "@/types/analysis"
import type { BatchItem } from "@/lib/types"
import { downscaleImage } from "@/lib/image-processing"
import { apiErrorMessage, readJson, thrownErrorMessage } from "@/lib/api-errors"
import { takePendingPartPhoto } from "@/lib/pending-part-photo"
import { cn } from "@/lib/utils"

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
    howItWorksSteps?: HowItWorksStep[]
    howItWorksHeading?: React.ReactNode
    useCaseCards?: UseCaseCard[]
    useCaseHeading?: string
    useCaseSubtitle?: string
    categoryLabel?: string
    educationalContent?: React.ReactNode
    faqContent?: React.ReactNode
    breadcrumbs?: BreadcrumbItem[]
    relatedContent?: React.ReactNode
    ctaModule?: React.ReactNode
    blogSection?: React.ReactNode
    /** Catalog stats for the homepage stats bar (only when showCategories=true) */
    catalogStats?: { totalProducts: number; totalCategories: number; totalGenerations: number }
    /** Analytics entry_point value for photo_analysis_started (e.g. 'truck_bed_covers') */
    entryPoint?: string
    /**
     * Shown with the upload card on sub-pages (the part identifier's sample
     * result): below it on narrow screens, beside it from lg. The upload
     * card stays first in reading order.
     */
    uploadAside?: React.ReactNode
}

export function VehicleAnalyzer({ title, description, promptContext, showCategories = false, detectedProductsTitle, analysisMode: analysisModeProp = "vehicle", howItWorksSteps, howItWorksHeading, useCaseCards, useCaseHeading, useCaseSubtitle, categoryLabel, educationalContent, faqContent, breadcrumbs, relatedContent, ctaModule, blogSection, catalogStats, entryPoint = 'homepage', uploadAside }: VehicleAnalyzerProps) {
    const router = useRouter()
    // Set once a part record exists and we're on our way to /r/{id}
    const navigatingRef = useRef(false)
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

    // Track created object URLs for cleanup (P-05, avoid stale closure)
    const createdUrlsRef = useRef<string[]>([])

    // Cleanup preview URLs
    useEffect(() => {
        const urls = createdUrlsRef.current // same array that later pushes go into
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url))
        }
    }, []) // Run once on unmount

    const handleFilesSelect = async (files: File[]) => {
        // A part analysis uses one photo, so only one is kept: the card shows
        // exactly the photo that gets sent
        const picked = analysisMode === "part" ? files.slice(0, 1) : files
        // Downscale files before uploading
        const downscaledFiles = await Promise.all(picked.map(f => downscaleImage(f).catch(() => f)))

        // Create ONE item for all the dropped files (User intention: 1 Drop = 1 Vehicle)
        const previews = downscaledFiles.map(file => {
            const url = URL.createObjectURL(file)
            createdUrlsRef.current.push(url) // Track for cleanup (P-05)
            return { id: crypto.randomUUID(), file, preview: url, publicUrl: null }
        })
        const newItem: BatchItem = {
            id: crypto.randomUUID(),
            images: previews,
            status: "pending",
            progress: 0,
            result: null,
            detectedProducts: [],
            partIdentification: null,
            error: null,
            loadingMessage: null
        }
        // One part per analysis: a new part photo replaces the one waiting
        setBatchItems(prev => analysisMode === "part" ? [newItem] : [...prev, newItem])
        setAnalysisState("idle")
    }

    // "Add another photo" / "Try another photo" on a /r/ part result: the
    // photo picked there arrives here, ready for Identify Part
    useEffect(() => {
        if (analysisMode !== "part") return
        const photo = takePendingPartPhoto()
        if (!photo) return
        handleFilesSelect([photo]).then(() => {
            document.getElementById("upload-target")?.scrollIntoView({ behavior: "smooth", block: "start" })
        })
        // Mount only: the handoff is taken once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleAddImageToItem = async (itemId: string, files: File[]) => {
        const downscaledFiles = await Promise.all(files.map(f => downscaleImage(f).catch(() => f)))

        setBatchItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const newImages = downscaledFiles.map(file => {
                    const url = URL.createObjectURL(file)
                    createdUrlsRef.current.push(url)
                    return { id: crypto.randomUUID(), file, preview: url, publicUrl: null }
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
                id: crypto.randomUUID(),
                images: [img], // Keep the image object as is (with preview)
                status: "pending",
                progress: 0,
                result: null,
                detectedProducts: [],
                partIdentification: null,
                error: null,
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

        // Issue #12: parallel image uploads. A part analysis only ever used
        // its first photo, so only that one is uploaded.
        const imagesToUpload = analysisMode === "part" ? item.images.slice(0, 1) : item.images
        const uploadResults = await Promise.allSettled(
            imagesToUpload.map(async (img) => {
                if (img.publicUrl) return img // Already uploaded
                const { url, error: uploadError } = await uploadImageToSupabase(img.file)
                if (uploadError || !url) throw new Error(`Failed to upload ${img.file.name}`)
                return { ...img, publicUrl: url }
            })
        )

        const uploadedImages: { id: string, file: File, preview: string, publicUrl: string | null }[] = []
        for (const result of uploadResults) {
            if (result.status === 'fulfilled') {
                uploadedImages.push(result.value)
            } else {
                updateItem({ status: "error", error: result.reason?.message ?? "Upload failed", progress: 0, loadingMessage: null })
                return currentItem
            }
        }
        updateItem({ progress: 25 })

        // Update item with uploaded URLs
        // We update the state to preserve the publicUrls
        updateItem({ images: uploadedImages })

        const publicUrls = uploadedImages.map(img => img.publicUrl!).filter(Boolean)

        if (publicUrls.length === 0) {
            updateItem({ status: "error", error: "No images uploaded successfully", progress: 0 })
            return currentItem
        }

        // analysis_completed for category-page vehicle analyses (the homepage
        // reports it from /r/[id]); same outcome values, plus entry_point
        let completionTracked = false
        const trackCompletion = (outcome: string) => {
            completionTracked = true
            trackEvent('analysis_completed', { outcome, platform: getPlatform(), entry_point: entryPoint })
        }

        updateItem({ status: "analyzing", progress: 40, loadingMessage: analysisMode === "part" ? "Identifying part..." : "Analyzing vehicle..." })

        // 3. Analysis
        try {
            if (analysisMode === "part") {
                // --- Part Identification Mode ---
                // Save a record and follow it on /r/{id}: the server runs the
                // identification, so a locked phone or a trip to the Amazon
                // app doesn't lose the result
                updateItem({ loadingMessage: "Identifying your part...", progress: 50 })
                const createResponse = await fetch('/api/analyses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: publicUrls[0], kind: 'part' }),
                })
                const created = await readJson(createResponse)
                if (!createResponse.ok || !created.success || typeof created.id !== 'string') {
                    throw new Error(apiErrorMessage(createResponse.status, created, "Part identification failed. Please try again."))
                }
                navigatingRef.current = true
                updateItem({ loadingMessage: "Opening your result...", progress: 90 })
                router.push(`/r/${created.id}`)
            } else {
                // --- Vehicle Analysis Mode ---
                let result: AnalysisResults | null = null
                const detectedProducts: DetectedProduct[] = []
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
                    const fitmentRes = await readJson(analyzeResponse)
                    if (analyzeResponse.ok && fitmentRes.success) {
                        result = fitmentRes.data as AnalysisResults
                        if (result.vehicle_present === false) {
                            trackCompletion('unusable')
                            throw new Error("We don't see a vehicle in this photo. Upload a clear shot of a car or truck and try again.")
                        }
                        const v = result.primary
                        vehicleDetailsString = `${v.year} ${v.make} ${v.model} ${v.trim}`
                    } else {
                        throw new Error(apiErrorMessage(analyzeResponse.status, fitmentRes, "Analysis failed. Please try again."))
                    }
                }

                updateItem({ progress: 60 })

                // Products
                if (analysisType === "products" || analysisType === "all") {
                    updateItem({ loadingMessage: "Detecting and identifying products...", progress: 65 })
                    // One request: the server fetches the images once, detects product
                    // types, refines them in parallel, and logs them with the fitment row
                    const productsResponse = await fetch('/api/analyze/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageUrls: publicUrls, vehicleDetails: vehicleDetailsString, promptContext }),
                    })
                    const productsRes = await readJson(productsResponse)
                    if (productsResponse.ok && productsRes.success) {
                        detectedProducts.push(...(productsRes.data as DetectedProduct[]))
                        updateItem({ detectedProducts: [...detectedProducts], progress: 95 })
                    } else {
                        updateItem({ error: apiErrorMessage(productsResponse.status, productsRes, "Product detection failed. Please try again.") })
                    }
                }

                updateItem({
                    status: "complete",
                    progress: 100,
                    result,
                    detectedProducts,
                    loadingMessage: null
                })

                if (result) {
                    const isRange = result.primary.year?.includes('-')
                    trackCompletion(isRange ? 'partial' : getConfidenceBand(result.primary.confidence).toLowerCase())
                }
            }

        } catch (err) {
            if (analysisMode === "vehicle" && !completionTracked) trackCompletion('error')
            const errorMsg = thrownErrorMessage(err, "Analysis failed. Please try again.")
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

        trackEvent('photo_analysis_started', { platform: getPlatform(), entry_point: entryPoint })

        // Category pages show results inline below the card. The part
        // identifier stays on the card and goes straight to /r/{id}, like the
        // homepage photo tool.
        if (analysisMode !== "part") {
            setTimeout(() => {
                const resultsElement = document.getElementById("analysis-results")
                if (resultsElement) {
                    resultsElement.scrollIntoView({ behavior: "smooth", block: "start" })
                }
            }, 100)
        }

        // Process sequentially to avoid rate limits? Or parallel?
        // Let's do sequential for now to be safe with API limits.

        const pendingItems = batchItems.filter(i => i.status === "pending" || i.status === "error")

        for (const item of pendingItems) {
            await processItem(item, selectedAnalysis)
        }

        // Part identifier: keep the spinner while /r/{id} loads. If the
        // upload or record creation failed, the card shows the error and
        // "Identify Part" retries it.
        if (navigatingRef.current) return
        setAnalysisState(analysisMode === "part" ? "idle" : "complete")
    }

    return (
        <div className="flex min-h-screen flex-col">
            <div className="flex-1">
                <div className="bg-[#003223]">
                    {/* Homepage: dual-entry hero (photo tool + vehicle selector) */}
                    {showCategories ? (
                        <>
                            <HeroDualEntry />
                            <TrustStrip />
                        </>
                    ) : (
                        <>
                            <HeroSection title={title} description={description} />
                            {breadcrumbs && <BreadcrumbNav items={breadcrumbs} />}
                        </>
                    )}

                    {/* Upload zone: on sub-pages, always shown. */}
                    {!showCategories && (
                        <div
                            id="upload-zone"
                            className={cn(
                                "scroll-mt-20",
                                // From lg: label, card and caption rows shared by both
                                // columns, so the two cards' tops and bottoms line up
                                uploadAside && "lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:grid-rows-[auto_1fr_auto] lg:items-stretch lg:gap-y-2.5 lg:px-4 lg:pb-8"
                            )}
                        >
                            <div
                                id="upload-target"
                                className={cn("scroll-mt-24", uploadAside && "lg:row-span-3 lg:grid lg:grid-rows-subgrid lg:[&>div]:px-0 lg:[&>div]:pb-0")}
                            >
                                {uploadAside && analysisMode === "part" && (
                                    <HeroEyebrow className="hidden lg:block">Identify your part</HeroEyebrow>
                                )}
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
                                    isHomepage={false}
                                    categoryLabel={categoryLabel}
                                    activeMode={analysisMode}
                                    onModeSwitch={handleModeSwitch}
                                />
                            </div>
                            {uploadAside && (
                                // From lg the aside's own wrapper steps aside (contents),
                                // so its label, card and caption take the three rows
                                <div className="mx-auto w-full max-w-4xl px-4 pb-10 lg:row-span-3 lg:grid lg:max-w-none lg:grid-rows-subgrid lg:pb-0 lg:pl-6 lg:pr-0 lg:[&>div]:contents">
                                    {uploadAside}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sample Result Preview – visible on homepage */}
                    {showCategories && (
                        <SampleResultPreview />
                    )}
                </div>

                {/* Inline results on category pages. The part identifier shows
                    its result on /r/{id} instead. */}
                {!showCategories && analysisMode !== "part" && batchItems.length > 0 && (
                    <section id="analysis-results" className="bg-white w-full py-12">
                        <div className="container mx-auto px-4">
                            <BatchResults
                                items={batchItems}
                                detectedProductsTitle={detectedProductsTitle}
                            />
                        </div>
                    </section>
                )}

                {educationalContent}

                {/* Homepage: Browse by Vehicle + affiliate disclosure directly below hero */}
                {showCategories && <AffiliateDisclosure />}
                {showCategories && <BrowseByVehicle />}

                <HowItWorks steps={howItWorksSteps} heading={howItWorksHeading} />

                {/* Visual Separator */}
                {showCategories && <div className="w-full h-px bg-[#E0E0E0]" />}

                {showCategories && <ProductCategories />}

                {/* Homepage CTA Module: after Categories, before StatsBar */}
                {showCategories && (
                    <div className="w-full">
                        <SaveToGarageCTA placement="homepage" />
                    </div>
                )}

                {/* Catalog stats bar (replaces old StatsBar on homepage) */}
                {showCategories && catalogStats ? (
                    <CatalogStatsBar
                        totalProducts={catalogStats.totalProducts}
                        totalCategories={catalogStats.totalCategories}
                        totalGenerations={catalogStats.totalGenerations}
                    />
                ) : (
                    /* Sub-pages still get the catalog stats if provided, otherwise nothing */
                    !showCategories && catalogStats && (
                        <CatalogStatsBar
                            totalProducts={catalogStats.totalProducts}
                            totalCategories={catalogStats.totalCategories}
                            totalGenerations={catalogStats.totalGenerations}
                        />
                    )
                )}

                {/* Inject optional CTA Module mid-page for Category flows */}
                {ctaModule && (
                    <div className="w-full">
                        {ctaModule}
                    </div>
                )}

                {/* Cross-link: Part Identifier → Vehicle Analyzer */}
                {analysisMode === "part" && (
                    <div className="w-full bg-white py-8">
                        <div className="container max-w-6xl text-center">
                            <p className="text-muted-foreground">
                                Looking to identify your full vehicle fitment instead?{" "}
                                <Link href="/#upload-zone" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">
                                    Analyze your vehicle&apos;s year, make, model, and compatible accessories
                                </Link>
                            </p>
                        </div>
                    </div>
                )}

                {blogSection}

                {!showCategories && <UseCases cards={useCaseCards} heading={useCaseHeading} subtitle={useCaseSubtitle} />}
                {faqContent}
                {relatedContent}
            </div>

            <ImageCropperDialog
                isOpen={showCropper}
                onClose={() => setShowCropper(false)}
                imageSrc={originalImageSrc}
                onCropComplete={handleCropComplete}
            />
        </div>
    )
}
