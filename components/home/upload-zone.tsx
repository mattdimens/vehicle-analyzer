import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Loader, X, Send, Crop as CropIcon, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BatchItem } from "@/lib/types"

type AnalysisState = "idle" | "processing" | "complete"
type AnalysisSelection = "default" | "fitment" | "products" | "all"

interface UploadZoneProps {
    onFilesSelect: (files: File[]) => void
    batchItems: BatchItem[]
    onRemove: (id: string) => void
    onCrop: (id: string) => void
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
                                    {batchItems.length} image{batchItems.length !== 1 ? "s" : ""} selected
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

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {batchItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative group aspect-square rounded-lg overflow-hidden border bg-background shadow-sm"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <img
                                            src={item.preview}
                                            alt={item.file.name}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Status Overlay */}
                                        {item.status !== "pending" && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                {item.status === "uploading" && <Loader className="w-6 h-6 text-white animate-spin" />}
                                                {item.status === "analyzing" && <Loader className="w-6 h-6 text-white animate-spin" />}
                                                {item.status === "complete" && <div className="bg-green-500/80 text-white text-xs px-2 py-1 rounded-full">Done</div>}
                                                {item.status === "error" && <div className="bg-destructive/80 text-white text-xs px-2 py-1 rounded-full">Error</div>}
                                            </div>
                                        )}

                                        {/* Actions Overlay (Hover) */}
                                        <div className={cn(
                                            "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2",
                                            item.status !== "pending" && "hidden" // Hide actions if processing
                                        )}>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => onCrop(item.id)}
                                                title="Crop / Focus"
                                            >
                                                <CropIcon className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => onRemove(item.id)}
                                                title="Remove"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add more button */}
                                <div
                                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={(e) => {
                                        // This click propagates to the dropzone root
                                    }}
                                >
                                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground">Add more</span>
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
                                Start Batch Analysis
                                <Send className="w-4 h-4 ml-2" />
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Loader className="w-4 h-4 animate-spin" />
                                Processing Batch...
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            {/* Pills */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Badge variant="secondary">Batch Processing</Badge>
                <Badge variant="secondary">Instant Identification</Badge>
                <Badge variant="secondary">Accessory Matching</Badge>
            </div>
        </div>
    )
}
