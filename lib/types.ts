import type { AnalysisResults, DetectedProduct, PartIdentification } from "@/app/actions"

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
    partIdentification: PartIdentification | null
    error: string | null
    qualityIssues: string[]
    loadingMessage: string | null
}
