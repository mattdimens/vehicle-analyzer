"use client"

import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Loader, X, Send } from "lucide-react"
import { cn } from "@/lib/utils"

// Define types locally if not exported from page.tsx, or import them if they are shared.
// Since they were local to page.tsx, I'll redefine the simple ones here or accept strings.
type AnalysisState = "idle" | "fitment" | "products" | "all"
type AnalysisSelection = "default" | "fitment" | "products" | "all"

interface UploadZoneProps {
    onFileSelect: (file: File) => void
    preview: string | null
    onClear: (e: React.MouseEvent) => void
    analysisState: AnalysisState
    selectedAnalysis: AnalysisSelection
    onAnalysisChange: (value: AnalysisSelection) => void
    onStart: () => void
    uploadedFile: File | null
}

export function UploadZone({
    onFileSelect,
    preview,
    onClear,
    analysisState,
    selectedAnalysis,
    onAnalysisChange,
    onStart,
    uploadedFile,
}: UploadZoneProps) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                onFileSelect(acceptedFiles[0])
            }
        },
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
        },
        noClick: !!preview,
        noKeyboard: !!preview,
    })

    return (
        <div className="w-full px-4 pb-24">
            <div className="w-full max-w-2xl mx-auto rounded-2xl border bg-card shadow-lg">
                {/* Dropzone Area */}
                <div
                    {...getRootProps()}
                    className={cn(
                        "min-h-48 w-full p-6 flex flex-col justify-center items-center transition-colors rounded-t-2xl",
                        !preview &&
                        (isDragActive
                            ? "bg-primary/5 cursor-pointer"
                            : "hover:bg-muted/50 cursor-pointer")
                    )}
                >
                    <input {...getInputProps()} />

                    {!preview && (
                        <div className="flex flex-col items-center justify-center gap-4 text-center">
                            <Upload className="h-10 w-10 text-muted-foreground" />
                            <p className="text-lg font-medium text-muted-foreground">
                                {isDragActive
                                    ? "Drop the image here ..."
                                    : "Drag 'n' drop an image, or click to select"}
                            </p>
                        </div>
                    )}

                    {preview && (
                        <div className="relative w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-border bg-background p-3 shadow-sm">
                            <div className="flex items-start gap-3">
                                <img
                                    src={preview}
                                    alt="Vehicle preview"
                                    className="w-20 h-20 rounded-md object-cover border"
                                />
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {uploadedFile?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Image selected
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={onClear}
                                    aria-label="Remove image"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Bar */}
                <div className="flex items-center gap-4 p-4 border-t bg-muted/50 rounded-b-2xl">
                    <select
                        value={selectedAnalysis}
                        onChange={(e) =>
                            onAnalysisChange(e.target.value as AnalysisSelection)
                        }
                        className="h-9 px-3 rounded-md border bg-card text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={analysisState !== "idle"}
                    >
                        <option value="default" disabled>
                            Choose Analysis...
                        </option>
                        <option value="fitment">Analyze Fitment</option>
                        <option value="products">Detect Products</option>
                        <option value="all">Fitment & Products</option>
                    </select>

                    <div className="flex-1"></div>

                    <Button
                        onClick={onStart}
                        disabled={
                            !uploadedFile ||
                            analysisState !== "idle" ||
                            selectedAnalysis === "default"
                        }
                        size="default"
                    >
                        {analysisState === "idle" ? (
                            <>
                                Start
                                <Send className="w-4 h-4" />
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Loader className="w-4 h-4 animate-spin" />
                                Processing...
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            {/* Pills */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Badge variant="secondary">Instant Identification</Badge>
                <Badge variant="secondary">Accessory Matching</Badge>
                <Badge variant="secondary">No Sign-Up Required</Badge>
            </div>
        </div>
    )
}
