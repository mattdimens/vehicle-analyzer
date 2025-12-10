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
            <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-bold tracking-tight">Analysis Results</h2>
                <div className="text-sm text-muted-foreground">
                    {items.filter(i => i.status === "complete").length} of {items.length} completed
                </div>
            </div>

            <div className="rounded-[2rem] border border-border/40 bg-white shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-4 border-b border-border/40 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-5 pl-2">Vehicle</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-4">Progress</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="divide-y divide-border/40">
                    {items.map((item) => {
                        const isExpanded = expandedItems.has(item.id)
                        const isComplete = item.status === "complete"
                        const isError = item.status === "error"
                        const isProcessing = ["uploading", "quality_check", "analyzing"].includes(item.status)
                        const primaryImage = item.images[0]
                        const title = primaryImage ? primaryImage.file.name : "Unknown Vehicle"

                        // Format file size
                        const size = primaryImage ? (primaryImage.file.size / (1024 * 1024)).toFixed(1) + " MB" : ""

                        return (
                            <div key={item.id} className="bg-white group transition-all">
                                <div
                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center px-6 md:px-8 py-5 cursor-pointer hover:bg-muted/20 transition-colors"
                                    onClick={() => toggleExpand(item.id)}
                                >
                                    {/* Col 1: Thumbnail + Name */}
                                    <div className="col-span-1 md:col-span-5 flex items-center gap-5">
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted shadow-sm group-hover:shadow-md transition-all">
                                            {primaryImage ? (
                                                <img
                                                    src={primaryImage.preview}
                                                    alt={title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-foreground/90 truncate">{title}</div>
                                            <div className="text-xs text-muted-foreground">{size}</div>
                                        </div>
                                    </div>

                                    {/* Col 2: Status */}
                                    <div className="col-span-1 md:col-span-2 flex items-center">
                                        {isComplete ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Completed
                                            </span>
                                        ) : isError ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                Failed
                                            </span>
                                        ) : isProcessing ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Analyzed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                                                Pending
                                            </span>
                                        )}
                                    </div>

                                    {/* Col 3: Progress/Result */}
                                    <div className="col-span-1 md:col-span-4 w-full">
                                        {isProcessing ? (
                                            <div className="w-full max-w-[240px]">
                                                <div className="flex justify-between text-xs mb-1.5 font-medium text-muted-foreground">
                                                    <span>{item.loadingMessage || "Processing..."}</span>
                                                    <span>{item.progress}%</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-full"
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : isComplete ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground/90 truncate">
                                                    {item.result?.primary ? `${item.result.primary.year} ${item.result.primary.make} ${item.result.primary.model}` : "Analysis Ready"}
                                                </span>
                                                <div className="h-2 w-24 rounded-full bg-emerald-100 mt-1.5 overflow-hidden">
                                                    <div className="h-full w-full bg-emerald-500 rounded-full" />
                                                </div>
                                            </div>
                                        ) : isError ? (
                                            <span className="text-sm text-red-600 font-medium truncate">{item.error}</span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Waiting...</span>
                                        )}
                                    </div>

                                    {/* Col 4: Action */}
                                    <div className="hidden md:flex col-span-1 justify-end">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-border/40 bg-gray-50/50 p-6 md:p-8 animate-in slide-in-from-top-1 duration-200">
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
                                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-900 text-sm">
                                                <div className="font-semibold mb-1">Analysis Failed</div>
                                                {item.error}
                                            </div>
                                        ) : item.status === "pending" ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
                                                <p className="text-sm italic">Waiting...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40 mb-3" />
                                                <p className="text-sm">Analysis in progress...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

