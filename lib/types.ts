import type { AnalysisResults, DetectedProduct } from "@/app/actions"

export interface BatchItem {
    id: string
    images: {
        id: string
        file: File
        preview: string
        publicUrl: string | null
    }[]
    status: "pending" | "uploading" | "quality_check" | "analyzing" | "complete" | "error" | "paused"
    progress: number
    result: AnalysisResults | null
    detectedProducts: DetectedProduct[]
    error: string | null
    qualityIssues: string[]
    loadingMessage: string | null
}
