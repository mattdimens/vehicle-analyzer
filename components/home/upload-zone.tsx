import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Loader, X, Send, Crop as CropIcon, AlertTriangle, Search, Tag, Zap, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BatchItem } from "@/lib/types"

type AnalysisState = "idle" | "processing" | "complete"
type AnalysisSelection = "default" | "fitment" | "products" | "all"

interface UploadZoneProps {
    onFilesSelect: (files: File[]) => void
    batchItems: BatchItem[]
    onRemove: (id: string) => void
    onCrop: (itemId: string, imageId: string) => void
    onClearAll: (e: React.MouseEvent) => void
    analysisState: AnalysisState
    selectedAnalysis: AnalysisSelection
    onAnalysisChange: (value: AnalysisSelection) => void
    onStart: () => void
}

export function UploadZone({
    onFilesSelect,
    batchItems,
    onRemove,
    onCrop,
    onClearAll,
    analysisState,
    selectedAnalysis,
    onAnalysisChange,
    onStart,
}: UploadZoneProps) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                onFilesSelect(acceptedFiles)
            }
        },
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
        },
        multiple: true,
        disabled: analysisState === "processing",
    })

    const hasItems = batchItems.length > 0

    return (
        <div className="w-full px-4 pb-24">
            <div className="w-full max-w-4xl mx-auto rounded-2xl border bg-card shadow-lg">
                {/* Dropzone Area */}
                <div
                    {...getRootProps()}
                    className={cn(
                        "min-h-48 w-full p-6 flex flex-col justify-center items-center transition-colors rounded-t-2xl",
                        !hasItems &&
                        (isDragActive
                            ? "bg-primary/5 cursor-pointer"
                            : "hover:bg-muted/50 cursor-pointer"),
                        hasItems && "border-b border-border bg-muted/10"
                    )}
                >
                    <input {...getInputProps()} />

                    {!hasItems && (
                        <div className="flex flex-col items-center justify-center gap-4 text-center">
                            <Upload className="h-10 w-10 text-muted-foreground" />
                            <p className="text-lg font-medium text-muted-foreground">
                                {isDragActive
                                    ? "Drop the images here ..."
                                    : "Drag 'n' drop images, or click to select"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Upload multiple vehicle images for batch analysis
                            </p>
                        </div>
                    )}

                    {hasItems && (
                        <div className="w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    {batchItems.length} vehicle{batchItems.length !== 1 ? "s" : ""} selected
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onClearAll(e)
                                    }}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    Clear All
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {batchItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative p-3 rounded-xl border bg-background shadow-sm hover:shadow-md transition-shadow"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-muted-foreground">Vehicle {item.id}</span>
                                            {item.status === "pending" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                    onClick={() => onRemove(item.id)}
                                                    title="Remove Vehicle"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Horizontal Image Scroll */}
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                                            {item.images.map((img) => (
                                                <div key={img.id} className="relative group shrink-0 w-24 h-24 rounded-lg overflow-hidden border">
                                                    <img
                                                        src={img.preview}
                                                        alt={img.file.name}
                                                        className="w-full h-full object-cover"
                                                    />

                                                    {/* Image Actions */}
                                                    {item.status === "pending" && (
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                                                                onClick={() => onCrop(item.id, img.id)}
                                                            >
                                                                <CropIcon className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
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
                                                    <span className="text-muted-foreground">{item.images.length} images</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add more button */}
                                <div
                                    className="min-h-[160px] rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={(e) => {
                                        // This click propagates to the dropzone root
                                    }}
                                >
                                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground">Add another vehicle</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-t bg-muted/50 rounded-b-2xl">
                    <select
                        value={selectedAnalysis}
                        onChange={(e) =>
                            onAnalysisChange(e.target.value as AnalysisSelection)
                        }
                        className="h-9 w-full sm:w-auto px-3 rounded-md border bg-card text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={analysisState !== "idle"}
                    >
                        <option value="default" disabled>
                            Choose Analysis...
                        </option>
                        <option value="fitment">Analyze Fitment</option>
                        <option value="products">Detect Products</option>
                        <option value="all">Fitment & Products</option>
                    </select>

                    <div className="hidden sm:block flex-1"></div>

                    <Button
                        onClick={onStart}
                        disabled={
                            !hasItems ||
                            analysisState !== "idle" ||
                            selectedAnalysis === "default"
                        }
                        size="default"
                        className="w-full sm:w-auto"
                    >
                        {analysisState === "idle" ? (
                            <>
                                {batchItems.length >= 2 ? "Start Batch Analysis" : "Start Analysis"}
                                <Send className="w-4 h-4 ml-2" />
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Loader className="w-4 h-4 animate-spin" />
                                {batchItems.length >= 2 ? "Processing Batch..." : "Processing..."}
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            {/* Pills */}
            {/* Pills */}
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
        </div>
    )
}
