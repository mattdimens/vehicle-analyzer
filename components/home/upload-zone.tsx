"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useDropzone, type FileRejection } from "react-dropzone"
import { Button } from "@/components/ui/button"

import { Upload, Loader, X, Send, Crop as CropIcon, Search, Tag, Zap, Layers, ChevronDown, ChevronUp, Camera, Maximize, RotateCw, XCircle, Eye, CheckCircle2, Scan, Hash, Sun, Download, Check, CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BatchItem } from "@/lib/types"
import type { AnalysisMode } from "@/components/home/vehicle-analyzer"

type AnalysisState = "idle" | "processing" | "complete"
type AnalysisSelection = "default" | "fitment" | "products" | "all"

interface UploadZoneProps {
    onFilesSelect: (files: File[]) => void
    batchItems: BatchItem[]
    onRemove: (id: string) => void
    onRemoveImage: (itemId: string, imageId: string) => void
    onCrop: (itemId: string, imageId: string) => void
    onAddImages: (itemId: string, files: File[]) => void
    onSplit: (itemId: string) => void
    onMerge: (sourceId: string, targetId: string) => void
    onClearAll: (e: React.MouseEvent) => void
    analysisState: AnalysisState
    selectedAnalysis: AnalysisSelection
    onAnalysisChange: (value: AnalysisSelection) => void
    onStart: () => void
    onReset?: () => void
    analysisMode?: AnalysisMode
    isHomepage?: boolean
    categoryLabel?: string
    activeMode?: AnalysisMode
    onModeSwitch?: (mode: AnalysisMode) => void
}

export function UploadZone({
    onFilesSelect,
    batchItems,
    onRemove,
    onRemoveImage,
    onCrop,
    onAddImages,
    onSplit,
    onMerge,
    onClearAll,
    analysisState,
    selectedAnalysis,
    onAnalysisChange,
    onStart,
    onReset,
    analysisMode = "vehicle",
    isHomepage = false,
    categoryLabel,
    activeMode = "vehicle",
    onModeSwitch,
}: UploadZoneProps) {
    const [dragOverId, setDragOverId] = useState<string | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showExampleModal, setShowExampleModal] = useState(false)
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
    // Part identifier: several photos were dropped and only the first was kept
    const [keptFirstOnly, setKeptFirstOnly] = useState(false)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const isPart = analysisMode === "part"

    const handleCameraSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setKeptFirstOnly(false)
            onFilesSelect(Array.from(e.target.files))
        }
        e.target.value = ""
    }

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("application/vehicle-item-id", id)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault()
        if (e.dataTransfer.types.includes("application/vehicle-item-id")) {
            setDragOverId(id)
            e.dataTransfer.dropEffect = "move"
        }
    }

    const handleDragLeave = () => {
        setDragOverId(null)
    }

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        setDragOverId(null)
        const sourceId = e.dataTransfer.getData("application/vehicle-item-id")
        if (sourceId && sourceId !== targetId) {
            onMerge(sourceId, targetId)
        }
    }

    const [dropError, setDropError] = useState<string | null>(null)
    const hasItems = batchItems.length > 0

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop: (acceptedFiles, fileRejections) => {
            setDropError(null)
            if (isPart) {
                // One photo per part analysis. The picker takes one file; a
                // drop of several keeps the first image (multiple: false
                // would reject the whole drop instead)
                if (acceptedFiles.length > 0) {
                    setKeptFirstOnly(acceptedFiles.length + fileRejections.length > 1)
                    onFilesSelect(acceptedFiles.slice(0, 1))
                } else if (fileRejections.length > 0) {
                    setDropError(partRejectionMessage(fileRejections[0]))
                }
                return
            }
            if (acceptedFiles.length > 0) {
                onFilesSelect(acceptedFiles)
            }
        },
        onDropRejected: (rejections) => {
            if (isPart) return // handled in onDrop
            const errors = rejections.flatMap(r => r.errors.map(e => e.message))
            const unique = [...new Set(errors)]
            if (unique.some(e => e.includes('larger'))) {
                setDropError('One or more files exceed the 10MB size limit.')
            } else if (unique.some(e => e.includes('many'))) {
                setDropError('Maximum 10 files allowed per upload.')
            } else {
                setDropError('Only JPEG, PNG, GIF, and WebP images are accepted.')
            }
        },
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: isPart ? 0 : 10,
        multiple: true,
        // Part identifier with a photo added: its own controls replace or
        // remove it, so the zone only takes drops
        noClick: isPart && hasItems,
        noKeyboard: isPart && hasItems,
        disabled: analysisState === "processing",
    })

    const partItem = isPart ? batchItems[0] : undefined

    return (
        <div className={cn("w-full px-4 pb-8", isPart && "lg:flex lg:flex-col")}>
            <div className={cn("w-full max-w-4xl mx-auto rounded-2xl border bg-card shadow-lg", isPart && "lg:flex lg:flex-1 lg:flex-col")}>
                {/* Homepage Mode Tabs */}
                {isHomepage && onModeSwitch && (
                    <div className="flex rounded-t-2xl overflow-hidden border-b border-border" role="radiogroup" aria-label="Analysis mode">
                        <button
                            type="button"
                            role="radio"
                            aria-checked={activeMode === "vehicle"}
                            onClick={() => onModeSwitch("vehicle")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors",
                                activeMode === "vehicle"
                                    ? "bg-[#E8712B] text-white"
                                    : "bg-muted/30 text-muted-foreground hover:bg-muted/60"
                            )}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-2-2.2-3.3C13 5.6 12 5 10.8 5H5.6c-.8 0-1.5.5-1.8 1.2L2 11c-.5 1.1-.2 2.3.7 3" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                            Vehicle Fitment & Accessories
                        </button>
                        <button
                            type="button"
                            role="radio"
                            aria-checked={activeMode === "part"}
                            onClick={() => onModeSwitch("part")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors",
                                activeMode === "part"
                                    ? "bg-[#E8712B] text-white"
                                    : "bg-muted/30 text-muted-foreground hover:bg-muted/60"
                            )}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" /><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                            Identify a Specific Part
                        </button>
                    </div>
                )}
                {/* Part identifier from md: the drop zone sits inset in the card, with an error row above it and the tips below it */}
                <div className={isPart ? "flex flex-col md:gap-3.5 md:p-5 md:pb-3.5 lg:flex-1" : undefined}>
                {isPart && dropError && (
                    <div role="alert" className="hidden md:flex items-center gap-2.5 rounded-[10px] bg-[#FDECEC] px-3.5 py-2.5 text-sm text-[#991B1B]">
                        <CircleAlert className="h-[18px] w-[18px] shrink-0 text-[#B91C1C]" aria-hidden="true" />
                        {dropError}
                    </div>
                )}
                {/* Dropzone Area */}
                <div
                    {...getRootProps()}
                    role={isPart && hasItems ? undefined : "button"}
                    aria-label={
                        isPart
                            ? (hasItems ? undefined : "Upload a photo of your part: drag and drop or browse your files")
                            : "Upload vehicle images: drag and drop or click to select"
                    }
                    className={cn(
                        "min-h-48 w-full p-6 flex flex-col justify-center items-center transition-colors",
                        !(isHomepage && onModeSwitch) && "rounded-t-2xl",
                        !hasItems &&
                        (isDragActive
                            ? "bg-primary/5 cursor-pointer"
                            : "hover:bg-muted/50 cursor-pointer"),
                        hasItems && "border-b border-border bg-muted/10",
                        isPart && cn(
                            "md:min-h-60 md:flex-1 md:rounded-xl md:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            isDragActive
                                ? "md:border-2 md:border-dashed md:border-primary md:bg-[#FFF2EB]"
                                : hasItems
                                    ? "md:items-stretch md:border md:border-[#D4DFDB] md:bg-white md:p-5"
                                    : "md:border-2 md:border-dashed md:border-[#BFD0CA] md:bg-[#F6FAF8] md:hover:bg-[#EEF5F2]"
                        )
                    )}
                >
                    <input {...getInputProps(isPart ? { multiple: false } : undefined)} />

                    {/* Part identifier from md: drag, photo added and empty states */}
                    {isPart && (
                        <div className="hidden md:flex w-full flex-1 flex-col justify-center">
                            {isDragActive ? (
                                <PartDropPrompt dragging />
                            ) : partItem ? (
                                <PartPhotoRow
                                    item={partItem}
                                    onReplace={open}
                                    onCrop={onCrop}
                                    onRemove={(id) => {
                                        setKeptFirstOnly(false)
                                        onRemove(id)
                                    }}
                                />
                            ) : (
                                <PartDropPrompt />
                            )}
                        </div>
                    )}

                    {!hasItems && (
                        <>
                            {/* Desktop: Drag & Drop UI */}
                            {!isPart && <div className="hidden md:flex flex-col items-center justify-center gap-4 text-center">
                                <Upload className="h-10 w-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground text-center max-w-[500px] mx-auto">
                                    {activeMode === "part"
                                        ? "Got a close-up of an individual part? Upload it and we'll tell you exactly what it is, including engine components, suspension, interior parts, and more."
                                        : "Upload a photo of any vehicle and we'll identify make, model, trim, and every visible part and accessory, with links to buy."}
                                </p>
                                <p className="text-lg font-medium text-muted-foreground">
                                    {isDragActive
                                        ? "Drop the images here ..."
                                        : "Drag 'n' drop images, or click to select"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Upload multiple images per vehicle for better accuracy. Max 10MB per file.
                                </p>
                                {dropError && (
                                    <p className="text-sm text-destructive font-medium" role="alert">
                                        {dropError}
                                    </p>
                                )}
                            </div>}

                            {/* Mobile: Buttons UI */}
                            <div className="flex md:hidden flex-col w-full gap-4 py-4">
                                <p className="text-sm text-muted-foreground text-center max-w-[500px] mx-auto">
                                    {activeMode === "part"
                                        ? "Got a close-up of an individual part? Upload it and we'll tell you exactly what it is, including engine components, suspension, interior parts, and more."
                                        : "Upload a photo of any vehicle and we'll identify make, model, trim, and every visible part and accessory, with links to buy."}
                                </p>
                                <Button
                                    size="lg"
                                    className="w-full h-14 text-lg font-semibold shadow-lg rounded-xl"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        cameraInputRef.current?.click()
                                    }}
                                >
                                    <Camera className="mr-2 h-6 w-6" />
                                    Take a Photo
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full h-12 text-base font-medium border-2 border-dashed border-primary/20 hover:bg-primary/5 rounded-xl text-primary"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        open()
                                    }}
                                >
                                    <Upload className="mr-2 h-5 w-5" />
                                    Upload from Gallery
                                </Button>
                                {!isPart && (
                                    <p className="text-xs text-center text-muted-foreground/80">
                                        Upload multiple angles for better accuracy
                                    </p>
                                )}
                                {dropError && (
                                    <p className="text-sm text-center text-destructive font-medium" role="alert">
                                        {dropError}
                                    </p>
                                )}
                            </div>

                            {/* Hidden Camera Input */}
                            <input
                                type="file"
                                ref={cameraInputRef}
                                className="hidden"
                                accept="image/*"
                                capture="environment"
                                onChange={handleCameraSelect}
                            />
                        </>
                    )}

                    {hasItems && (
                        <div className={cn("w-full", isPart && "md:hidden")}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    {isPart
                                        ? "Your photo"
                                        : `${batchItems.length} vehicle${batchItems.length !== 1 ? "s" : ""} selected`}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setKeptFirstOnly(false)
                                        onClearAll(e)
                                    }}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    Clear All
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {batchItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        draggable={item.status === 'pending'} // Only pending items can be moved
                                        onDragStart={(e) => handleDragStart(e, item.id)}
                                        onDragOver={(e) => item.status === 'pending' && handleDragOver(e, item.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => item.status === 'pending' && handleDrop(e, item.id)}
                                        className={cn(
                                            "relative p-3 rounded-xl border bg-background shadow-sm hover:shadow-md transition-shadow",
                                            dragOverId === item.id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-muted-foreground">{analysisMode === "part" ? "Part" : "Vehicle"} {index + 1}</span>
                                            <div className="flex items-center gap-1">
                                                {!isPart && item.images.length > 1 && item.status === "pending" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                                                        onClick={() => onSplit(item.id)}
                                                        title="Split into individual vehicles"
                                                    >
                                                        Split
                                                    </Button>
                                                )}
                                                {(item.status === "pending" || (isPart && item.status === "error")) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                        onClick={() => {
                                                            setKeptFirstOnly(false)
                                                            onRemove(item.id)
                                                        }}
                                                        title="Remove Vehicle"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Horizontal Image Scroll */}
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                                            {item.images.map((img) => (
                                                <div key={img.id} className="relative group shrink-0 w-24 h-24 rounded-lg overflow-hidden border">
                                                    {/* eslint-disable-next-line @next/next/no-img-element -- user photo (Supabase/blob URL); skip Vercel image optimization quota */}
                                                    <img
                                                        src={img.preview}
                                                        alt={img.file.name}
                                                        className={cn("w-full h-full", isPart ? "bg-white object-contain" : "object-cover")}
                                                    />

                                                    {/* Image Actions */}
                                                    {item.status === "pending" && (
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                                                                onClick={() => onCrop(item.id, img.id)}
                                                                title="Crop"
                                                            >
                                                                <CropIcon className="w-3 h-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    onRemoveImage(item.id, img.id)
                                                                }}
                                                                title="Delete Image"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Add Image Button (Mini): one photo per part analysis */}
                                            {!isPart && item.status === "pending" && (
                                                <label className="shrink-0 w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/50 hover:bg-muted/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files.length > 0) {
                                                                onAddImages(item.id, Array.from(e.target.files))
                                                                // Reset value to allow re-upload of same file if needed
                                                                e.target.value = ''
                                                            }
                                                        }}
                                                    />
                                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mb-1">
                                                        <span className="text-lg leading-none pb-0.5 text-muted-foreground">+</span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">Add</span>
                                                </label>
                                            )}
                                        </div>

                                        {/* Status Footer */}
                                        <div className="mt-3 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                {item.status === "uploading" && (
                                                    <span className="text-blue-500 flex items-center gap-1">
                                                        <Loader className="w-3 h-3 animate-spin" /> Uploading...
                                                    </span>
                                                )}
                                                {item.status === "analyzing" && (
                                                    <span className="text-purple-500 flex items-center gap-1">
                                                        <Loader className="w-3 h-3 animate-spin" /> Analyzing...
                                                    </span>
                                                )}
                                                {item.status === "complete" && (
                                                    <span className="text-green-600 font-medium">Complete</span>
                                                )}
                                                {item.status === "error" && (
                                                    <span className="text-destructive font-medium">Error</span>
                                                )}
                                                {item.status === "pending" && (
                                                    <span className="text-muted-foreground">
                                                        {isPart ? "Photo ready" : `${item.images.length} image${item.images.length !== 1 ? "s" : ""}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {isPart && item.status === "error" && item.error && (
                                            <p role="alert" className="mt-2 text-xs text-destructive">{item.error}</p>
                                        )}
                                    </div>
                                ))}

                                {/* Add more button (one part per analysis on the part identifier) */}
                                {analysisMode !== "part" && <div
                                    className="min-h-[160px] rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                                    // Clicks propagate to the dropzone root, which opens the file picker
                                >
                                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground">Add another vehicle</span>
                                </div>}
                            </div>
                        </div>
                    )}

                    {isPart && hasItems && keptFirstOnly && (
                        <p role="status" className="mt-3 text-center text-xs text-muted-foreground">
                            We used the first photo. The Part Identifier works with one photo at a time.
                        </p>
                    )}
                </div>

                {/* Tips for Best Results */}
                {isPart ? (
                    <div className="px-4 py-3 border-t border-border/50 md:border-t-0 md:p-0">
                        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Scan className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                                Fill the frame with the part
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Hash className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                                Show any stamped part number
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Sun className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                                Good light, no filters
                            </span>
                        </div>
                    </div>
                ) : (
                <div className="px-4 py-3 border-t border-border/50">
                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Camera className="w-3.5 h-3.5 flex-shrink-0" />
                            Clear, well-lit photos work best
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Maximize className="w-3.5 h-3.5 flex-shrink-0" />
                            Include the full vehicle or the full part
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <RotateCw className="w-3.5 h-3.5 flex-shrink-0" />
                            Multiple angles improve accuracy
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            Avoid heavily filtered or edited images
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowExampleModal(true)}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            See example
                        </button>
                    </div>
                </div>
                )}
                </div>

                {/* Example Photo Modal */}
                {showExampleModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowExampleModal(false)}
                    >
                        <div
                            className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-heading text-lg font-bold">Photo Tips</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowExampleModal(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                                {/* Good Example */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 to-emerald-50 border-2 border-green-400 flex flex-col items-center justify-center">
                                        <svg className="w-20 h-20 text-green-600/60" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="5" y="30" width="70" height="25" rx="6" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                                            <circle cx="20" cy="55" r="8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                                            <circle cx="60" cy="55" r="8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                                            <path d="M15 30 L22 18 H58 L68 30" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
                                            <rect x="28" y="20" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
                                        </svg>
                                        <div className="flex items-center gap-1 mt-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                            <span className="text-[10px] text-green-700/60 font-medium">Well-lit &bull; Full frame &bull; Sharp</span>
                                        </div>
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-green-600">✓ Good Photo</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Full vehicle visible, good lighting, clear &amp; sharp</p>
                                    </div>
                                </div>
                                {/* Bad Example */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-red-400 flex flex-col items-center justify-center">
                                        <svg className="w-20 h-20 text-red-500/40" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'blur(1.5px)' }}>
                                            <rect x="-10" y="30" width="70" height="25" rx="6" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" transform="rotate(-5 35 42)" />
                                            <circle cx="10" cy="55" r="8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                                            <circle cx="50" cy="55" r="8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                                        </svg>
                                        <div className="flex items-center gap-1 mt-2">
                                            <span className="text-[10px] text-red-600/60 font-medium">Dark &bull; Cropped &bull; Blurry</span>
                                        </div>
                                        <div className="absolute top-2 right-2">
                                            <XCircle className="w-6 h-6 text-red-500" />
                                        </div>
                                        {/* Simulated dark overlay */}
                                        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-red-600">✗ Bad Photo</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Vehicle cut off, low light, blurry or filtered</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-muted/50 p-4 text-center">
                                <p className="text-xs text-muted-foreground">Our analysis can still process imperfect photos, but better input = better results.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Control Bar */}
                <div className={cn("flex flex-col items-center gap-4 p-4 border-t bg-muted/50 rounded-b-2xl", isPart && "gap-3")}>
                    {/* Homepage: collapsible advanced radio buttons */}
                    {isHomepage && analysisMode !== "part" && (
                        <div className="w-full">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                                disabled={analysisState !== "idle"}
                            >
                                Advanced: Choose specific analysis type
                                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {showAdvanced && (
                                <div className="flex flex-wrap justify-center gap-4 mt-3 py-2">
                                    {[
                                        { value: "fitment" as const, label: "Fitment Only" },
                                        { value: "products" as const, label: "Products Only" },
                                        { value: "all" as const, label: "Both" },
                                    ].map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={cn(
                                                "flex items-center gap-2 cursor-pointer text-sm px-3 py-1.5 rounded-full border transition-colors",
                                                selectedAnalysis === opt.value
                                                    ? "border-primary bg-primary/10 text-primary font-medium"
                                                    : "border-border text-muted-foreground hover:border-primary/50"
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="analysis-type"
                                                value={opt.value}
                                                checked={selectedAnalysis === opt.value}
                                                onChange={() => onAnalysisChange(opt.value)}
                                                className="sr-only"
                                            />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Category pages: contextual label + optional dropdown */}
                    {!isHomepage && analysisMode !== "part" && (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {!showCategoryDropdown ? (
                                <>
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                                        <Zap className="w-3.5 h-3.5 text-primary" />
                                        Analyzing for: <span className="text-primary font-semibold">{categoryLabel ?? "All Categories"}</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowCategoryDropdown(true)}
                                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                                        disabled={analysisState !== "idle"}
                                    >
                                        change
                                    </button>
                                </>
                            ) : (
                                <select
                                    value={selectedAnalysis}
                                    onChange={(e) => {
                                        onAnalysisChange(e.target.value as AnalysisSelection)
                                        setShowCategoryDropdown(false)
                                    }}
                                    aria-label="Select analysis type"
                                    className="h-9 w-full sm:w-auto px-3 rounded-md border bg-card text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring"
                                    disabled={analysisState !== "idle"}
                                >
                                    <option value="fitment">Analyze Fitment Only</option>
                                    <option value="products">Detect Products Only</option>
                                    <option value="all">Fitment &amp; Products</option>
                                </select>
                            )}
                        </div>
                    )}

                    {!isPart && <div className="hidden sm:block flex-1"></div>}

                    <Button
                        onClick={analysisState === "complete" ? onReset : onStart}
                        disabled={
                            analysisState !== "complete" && (
                                !hasItems ||
                                analysisState !== "idle" ||
                                (analysisMode !== "part" && selectedAnalysis === "default")
                            )
                        }
                        size="default"
                        className="w-full sm:w-auto"
                    >
                        {analysisState === "idle" ? (
                            <>
                                {batchItems.length >= 2 ? "Start Batch Analysis" : analysisMode === "part" ? "Identify Part" : "Start Analysis"}
                                <Send className="w-4 h-4 ml-2" />
                            </>
                        ) : analysisState === "complete" ? (
                            <>
                                Start New Analysis
                                <Send className="w-4 h-4 ml-2" />
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Loader className="w-4 h-4 animate-spin" />
                                {isPart ? "Starting Identification..." : batchItems.length >= 2 ? "Processing Batch..." : "Processing..."}
                            </div>
                        )}
                    </Button>

                    {isPart && (
                        <p className="text-xs text-muted-foreground text-center">
                            Identifying a whole vehicle instead?{" "}
                            <Link
                                href="/"
                                className="text-primary hover:text-primary/80 font-medium underline underline-offset-2"
                            >
                                Use the Vehicle Analyzer
                            </Link>
                        </p>
                    )}
                </div>
            </div>

            {/* Pills (not on the part identifier, where the sample result sits next to the card) */}
            {!isPart && (
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
                            <Search className="h-4 w-4" />
                            Fitment Identification
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-sm font-medium text-purple-700">
                            <Tag className="h-4 w-4" />
                            Product Detection
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
                            <Zap className="h-4 w-4" />
                            Instant Results
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-orange-700">
                            <Layers className="h-4 w-4" />
                            Multi-Image Processing
                        </div>
                </div>
            )}
        </div>
    )
}

/** Part identifier rejection messages, from the first rejected file. */
function partRejectionMessage(rejection: FileRejection) {
    const codes = rejection.errors.map(e => e.code)
    if (codes.includes("file-too-large") && !codes.includes("file-invalid-type")) {
        return "That file is over 10MB. Try a smaller photo."
    }
    return "That file type isn't supported. Use a JPG, PNG, WebP or GIF."
}

/** "2.4 MB", "640 KB" */
function formatFileSize(bytes: number) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** Part identifier drop zone, empty or with a file dragged over it (from md). */
function PartDropPrompt({ dragging = false }: { dragging?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-1.5 text-center">
            {dragging ? (
                <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                    <Download className="h-7 w-7 text-white" aria-hidden="true" />
                </span>
            ) : (
                <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-[26px] w-[26px] text-primary" aria-hidden="true" />
                </span>
            )}
            <span className={cn("font-heading text-[22px] font-semibold", dragging ? "text-[#9A3412]" : "text-foreground")}>
                {dragging ? "Drop it here" : "Drag a photo of your part here"}
            </span>
            {dragging ? (
                <span className="text-[15px] text-[#7C2D12]">Release to add your photo</span>
            ) : (
                <>
                    <span className="text-[15px] text-muted-foreground">
                        or{" "}
                        <span className="font-semibold text-[#C2410C] underline underline-offset-[3px]">browse your files</span>
                    </span>
                    <span className="mt-1.5 text-[13px] text-muted-foreground">JPG, PNG, WebP or GIF, up to 10MB</span>
                </>
            )}
        </div>
    )
}

/** Part identifier with a photo added (from md): the photo, its details and its controls. */
function PartPhotoRow({ item, onReplace, onCrop, onRemove }: {
    item: BatchItem
    onReplace: () => void
    onCrop: (itemId: string, imageId: string) => void
    onRemove: (itemId: string) => void
}) {
    const image = item.images[0]
    if (!image) return null
    const pending = item.status === "pending"
    // After a failed start the visitor can retry ("Identify Part") or swap the photo
    const editable = pending || item.status === "error"
    const outlineClass = "h-11 px-3.5 border-[#C9D6D1] bg-white text-sm text-foreground hover:bg-muted hover:text-foreground"

    return (
        <div className="flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- user photo (blob URL); skip Vercel image optimization quota */}
            <img
                src={image.preview}
                alt="Your part photo"
                className="h-40 w-40 shrink-0 rounded-[10px] border border-[#D5DEE5] bg-white object-contain"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {pending && (
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#166534]">
                        <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                        Photo ready
                    </span>
                )}
                {(item.status === "uploading" || item.status === "analyzing") && (
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                        <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {item.status === "uploading" ? "Uploading..." : "Analyzing..."}
                    </span>
                )}
                {item.status === "complete" && (
                    <span className="text-[13px] font-semibold text-green-600">Complete</span>
                )}
                {item.status === "error" && (
                    <span role="alert" className="flex items-start gap-1.5 text-[13px] font-semibold text-destructive">
                        <CircleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
                        {item.error || "That didn't go through. Please try again."}
                    </span>
                )}
                <span className="truncate font-heading text-lg font-semibold text-foreground">{image.file.name}</span>
                <span className="text-[13px] text-muted-foreground">{formatFileSize(image.file.size)}</span>
                {editable && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <Button type="button" variant="outline" className={outlineClass} onClick={onReplace}>
                            Replace photo
                        </Button>
                        <Button type="button" variant="outline" className={outlineClass} onClick={() => onCrop(item.id, image.id)}>
                            Crop
                        </Button>
                        <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            className="h-11 px-1.5 text-sm font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
