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
    detectedProductsTitle?: string
}

/**
 * BatchResults component displays analysis results for multiple uploaded images
 */
export function BatchResults({ items, detectedProductsTitle }: BatchResultsProps) {
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

                    // Format file size (rough estimate)
                    const size = primaryImage ? (primaryImage.file.size / (1024 * 1024)).toFixed(1) + " MB" : ""

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "group rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
                                isExpanded ? "ring-2 ring-primary/10 border-primary/20" : "border-border/50"
                            )}
                        >
                            {/* Main Card Content */}
                            <div className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                                {/* Thumbnail */}
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted shadow-sm">
                                    {primaryImage ? (
                                        <img
                                            src={primaryImage.preview}
                                            alt={title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Content Info */}
                                <div className="flex-1 w-full min-w-0 grid gap-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className="font-semibold text-base truncate pr-4 text-foreground/90">
                                            {title}
                                        </h3>

                                        {/* Status Badge / Indicator */}
                                        <div className="shrink-0">
                                            {isComplete ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 text-xs font-medium">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    <span>Completed</span>
                                                </div>
                                            ) : isError ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-xs font-medium">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    <span>Failed</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                                                    {item.progress}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar & Subtext */}
                                    <div className="space-y-1.5">
                                        {isProcessing ? (
                                            <>
                                                <Progress
                                                    value={item.progress}
                                                    className="h-2 w-full bg-muted/50"
                                                // Add custom indicator class via CSS or style if needed, but default is fine usually.
                                                // For "orange" feel like image, we can override css variables or use inline style 
                                                // but stick to system design first (usually primary color).
                                                />
                                                <div className="flex justify-between items-center text-xs text-muted-foreground/80">
                                                    <span>{item.loadingMessage || "Processing..."}</span>
                                                    <span>{size}</span>
                                                </div>
                                            </>
                                        ) : isComplete ? (
                                            <div className="h-2 w-full rounded-full bg-green-500/20">
                                                <div className="h-full w-full rounded-full bg-green-500" />
                                            </div>
                                        ) : isError ? (
                                            <div className="h-2 w-full rounded-full bg-destructive/20">
                                                <div className="h-full w-full rounded-full bg-destructive" />
                                            </div>
                                        ) : (
                                            <div className="h-2 w-full rounded-full bg-muted" />
                                        )}

                                        {!isProcessing && (
                                            <div className="flex justify-between items-center text-xs text-muted-foreground/80">
                                                <span>
                                                    {isComplete
                                                        ? (item.result?.primary ? `${item.result.primary.year} ${item.result.primary.make} ${item.result.primary.model}` : "Analysis Ready")
                                                        : isError ? item.error : "Waiting to start..."}
                                                </span>
                                                <span>{size}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 sm:ml-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                                        onClick={() => toggleExpand(item.id)}
                                    >
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                    {/* Could add a 'Remove' X button here too if requested later */}
                                </div>
                            </div>

                            {/* Expanded Content (Results Only) */}
                            {isExpanded && (
                                <div className="border-t border-border/50 bg-muted/5 p-6 animate-in slide-in-from-top-2 duration-200">
                                    {isComplete ? (
                                        <ResultsDisplay
                                            results={item.result}
                                            detectedProducts={item.detectedProducts}
                                            error={item.error}
                                            productError={null}
                                            loadingMessage={null}
                                            progress={100}
                                            detectedProductsTitle={detectedProductsTitle}
                                        />
                                    ) : isError ? (
                                        <div className="p-4 rounded-lg bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200 border border-red-200 dark:border-red-900/50 text-sm">
                                            <strong>Analysis Failed:</strong> {item.error}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
                                            {isProcessing ? (
                                                <div className="text-center space-y-3">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                                    <p className="text-sm font-medium text-foreground">{item.loadingMessage}</p>
                                                    <p className="text-xs">Please wait while our AI models analyze your vehicle...</p>
                                                </div>
                                            ) : (
                                                <p>Ready to analyze</p>
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
