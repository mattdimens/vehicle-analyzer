"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VehicleSelector } from "@/components/home/vehicle-selector"
import { analysisConfig } from "@/config/analysis"
import { ResultLayout } from "./result-layout"

interface AnalysisRecord {
    id: string
    image_url: string
    status: 'identifying' | 'detecting_products' | 'complete' | 'error'
    result_data: any
    detected_products: any
    confidence: number
    error_details: string | null
}

export function AnalysisView({ id }: { id: string }) {
    const [record, setRecord] = useState<AnalysisRecord | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPolling, setIsPolling] = useState(true)

    const fetchRecord = useCallback(async () => {
        try {
            const res = await fetch(`/api/analyses/${id}`)
            if (!res.ok) {
                if (res.status === 404) setError("Analysis not found.")
                else setError("Failed to load analysis.")
                setIsPolling(false)
                return
            }
            const data = await res.json()
            setRecord(data.data)

            if (data.data.status === 'complete' || data.data.status === 'error') {
                setIsPolling(false)
            }
        } catch (err) {
            console.error(err)
            setError("Network error.")
            setIsPolling(false)
        }
    }, [id])

    useEffect(() => {
        fetchRecord()
    }, [fetchRecord])

    useEffect(() => {
        if (!isPolling) return
        const interval = setInterval(fetchRecord, 2000)
        return () => clearInterval(interval)
    }, [isPolling, fetchRecord])

    const handleRetry = async () => {
        setIsPolling(true)
        setError(null)
        setRecord(prev => prev ? { ...prev, status: 'identifying', error_details: null } : null)
        await fetch(`/api/analyses/${id}/process`, { method: 'POST' })
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl shadow-sm border border-border">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold">Error</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
                <div className="mt-6 w-full max-w-sm">
                    <p className="text-sm text-muted-foreground mb-4">Or pick your vehicle manually:</p>
                    <VehicleSelector />
                </div>
            </div>
        )
    }

    if (!record) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const { status, image_url, confidence } = record

    if (status === 'identifying' || status === 'detecting_products') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-border">
                <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden mb-8 shadow-inner">
                    <Image src={image_url} alt="Analyzing" fill className="object-cover opacity-70" />
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                    {status === 'identifying' ? 'Identifying Vehicle...' : 'Detecting Products...'}
                </h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Our AI is scanning your photo. This usually takes about 15-30 seconds.
                </p>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-border text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold text-destructive">Analysis Failed</h2>
                <p className="text-muted-foreground mt-2 mb-6">{record.error_details || 'Something went wrong.'}</p>
                <Button onClick={handleRetry} className="mb-8">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Analysis
                </Button>
                <div className="w-full max-w-md border-t pt-8">
                    <p className="text-sm font-medium mb-4">Or continue manually:</p>
                    <VehicleSelector />
                </div>
            </div>
        )
    }

    // Complete State
    if (confidence < analysisConfig.confidenceThresholds.unusable) {
        return (
            <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-border text-center">
                <div className="relative w-48 aspect-video rounded-xl overflow-hidden mb-6 opacity-50">
                    <Image src={image_url} alt="Unusable" fill className="object-cover" />
                </div>
                <h2 className="text-xl font-semibold mb-2">We couldn't find a vehicle in this photo</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                    Please make sure the vehicle is clearly visible, well-lit, and occupies most of the frame.
                </p>
                <Button asChild variant="outline" className="mb-8">
                    <a href="/">Try Another Photo</a>
                </Button>
                <div className="w-full max-w-md border-t pt-8">
                    <p className="text-sm font-medium mb-4">Or pick your vehicle manually:</p>
                    <VehicleSelector />
                </div>
            </div>
        )
    }

    // Hand off to Result Layout for Low/Medium/High confidence display
    return <ResultLayout record={record} />
}
