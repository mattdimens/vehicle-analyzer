"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { ResultsDisplay } from "@/components/home/results-display"
import type { BatchItem } from "@/lib/types"

interface BatchResultsProps {
    items: BatchItem[]
}

/**
 * BatchResults component displays analysis results for multiple uploaded images
 */
export function BatchResults({ items }: BatchResultsProps) {
    // Track expanded items by ID
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    // Auto-expand items when they complete (optional, maybe too noisy)
    // For now, let's just keep user control

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Analysis Results</h2>
                <div className="text-sm text-muted-foreground">
                    {items.filter(i => i.status === "complete").length} of {items.length} completed
                </div>
            </div>

            <div className="grid gap-4">
                {items.map((item) => {
                    const isExpanded = expandedItems.has(item.id)
                    const isComplete = item.status === "complete"
                    const isError = item.status === "error"
                    const isProcessing = ["uploading", "quality_check", "analyzing"].includes(item.status)
                    const primaryImage = item.images[0]
                    const title = primaryImage ? primaryImage.file.name : "Unknown Vehicle"
                    const otherCount = Math.max(0, item.images.length - 1)

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "rounded-lg border bg-card text-card-foreground shadow-sm transition-all",
                                isExpanded ? "ring-1 ring-primary/20" : ""
                            )}
                        >
                            {/* Header / Summary Row */}
                            <div
                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg"
                                onClick={() => toggleExpand(item.id)}
                            >
                                {/* Thumbnail */}
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                                    {primaryImage && (
                                        <img
                                            src={primaryImage.preview}
                                            alt={title}
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                    {otherCount > 0 && (
                                        <div className="absolute  bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 rounded-tl-md">
                                            +{otherCount}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold truncate">
                                            {title} {otherCount > 0 && <span className="text-muted-foreground font-normal text-sm">(+{otherCount} views)</span>}
                                        </h3>
                                        {isComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        {isError && <AlertCircle className="h-4 w-4 text-destructive" />}
                                    </div>

                                    {/* Status Text or Progress */}
                                    {isProcessing ? (
                                        <div className="space-y-1.5 max-w-xs">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{item.loadingMessage || "Processing..."}</span>
                                                <span>{item.progress}%</span>
                                            </div>
                                            <Progress value={item.progress} className="h-1.5" />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {isComplete
                                                ? (item.result?.primary ? `${item.result.primary.year} ${item.result.primary.make} ${item.result.primary.model}` : "Analysis Complete")
                                                : isError
                                                    ? item.error
                                                    : "Ready to start"}
                                        </p>
                                    )}
                                </div>

                                {/* Expand Button */}
                                <Button variant="ghost" size="icon" className="shrink-0">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="border-t p-4 bg-muted/10">
                                    {/* Source Images Grid */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Source Images</h4>
                                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
                                            {item.images.map((img, idx) => (
                                                <div key={img.id} className="relative h-32 w-32 shrink-0 rounded-lg overflow-hidden border shadow-sm">
                                                    <img
                                                        src={img.preview}
                                                        alt={`View ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {isComplete ? (
                                        <ResultsDisplay
                                            results={item.result}
                                            detectedProducts={item.detectedProducts}
                                            error={item.error}
                                            productError={null} // Handled in error prop mostly
                                            loadingMessage={null}
                                            progress={100}
                                        />
                                    ) : isError ? (
                                        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
                                            <strong>Error:</strong> {item.error}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                    <p>{item.loadingMessage}</p>
                                                </>
                                            ) : (
                                                <p>Waiting to start analysis...</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
