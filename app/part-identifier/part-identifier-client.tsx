"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
    Upload,
    Loader,
    Camera,
    RotateCcw,
    ShieldCheck,
    Wrench,
    Car,
    Brain,
    ExternalLink,
    AlertTriangle,
    Sparkles,
    Tag,
    ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createSignedUploadUrl, identifyPart } from "@/app/actions"
import type { PartIdentification } from "@/app/actions"
import { addAmazonAffiliateTag } from "@/lib/amazon"
import { trackEvent } from "@/lib/analytics"

type FlowState = "idle" | "uploading" | "analyzing" | "result" | "error"

export default function PartIdentifierClient() {
    const [state, setState] = useState<FlowState>("idle")
    const [preview, setPreview] = useState<string | null>(null)
    const [result, setResult] = useState<PartIdentification | null>(null)
    const [error, setError] = useState<string | null>(null)
    const previewUrlRef = useRef<string | null>(null)

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        }
    }, [])

    const processFile = useCallback(async (file: File) => {
        // Create preview
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        const url = URL.createObjectURL(file)
        previewUrlRef.current = url
        setPreview(url)
        setResult(null)
        setError(null)
        setState("uploading")

        trackEvent("part_identifier_upload", { file_type: file.type })

        try {
            // 1. Get signed upload URL
            const fileName = `part-id/${Date.now()}-${file.name}`
            const signedRes = await createSignedUploadUrl(fileName, file.type)
            if (!signedRes.success) throw new Error(signedRes.error)

            // 2. Upload to Supabase
            const uploadRes = await fetch(signedRes.data.signedUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            })
            if (!uploadRes.ok) throw new Error("Failed to upload image")

            // Build public URL
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/vehicle_images/${signedRes.data.path}`

            setState("analyzing")
            trackEvent("part_identifier_start", {})

            // 3. AI identification
            const idRes = await identifyPart(publicUrl)
            if (!idRes.success) throw new Error(idRes.error)

            setResult(idRes.data)
            setState("result")
            trackEvent("part_identifier_complete", {
                part_name: idRes.data.partName,
                confidence: idRes.data.confidence,
            })
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            setError(msg)
            setState("error")
            trackEvent("part_identifier_error", { error_message: msg })
        }
    }, [])

    const handleReset = useCallback(() => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
        setPreview(null)
        setResult(null)
        setError(null)
        setState("idle")
    }, [])

    const [dropError, setDropError] = useState<string | null>(null)

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (accepted) => {
            setDropError(null)
            if (accepted.length > 0) processFile(accepted[0])
        },
        onDropRejected: (rejections) => {
            const errors = rejections.flatMap((r) => r.errors.map((e) => e.message))
            if (errors.some((e) => e.includes("larger"))) {
                setDropError("File exceeds the 10MB size limit.")
            } else {
                setDropError("Only JPEG, PNG, GIF, and WebP images are accepted.")
            }
        },
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
        maxSize: 10 * 1024 * 1024,
        maxFiles: 1,
        multiple: false,
        disabled: state === "uploading" || state === "analyzing",
    })

    const isLowConfidence = result ? result.confidence < 30 : false

    const confidenceColor =
        result && result.confidence >= 80
            ? "text-emerald-600"
            : result && result.confidence >= 50
                ? "text-amber-600"
                : "text-red-500"

    const confidenceBarColor =
        result && result.confidence >= 80
            ? "bg-emerald-500"
            : result && result.confidence >= 50
                ? "bg-amber-500"
                : "bg-red-500"

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="flex w-full flex-col items-center justify-center px-4 pt-24 pb-12 text-center">
                <div className="max-w-4xl w-full flex flex-col items-center">
                    <h1 className="font-heading text-3xl md:text-5xl font-bold text-white">
                        Visual Part Identifier
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-white/80">
                        Snap a photo of any car part and let AI instantly identify it — name, function, vehicle compatibility, and where to buy it.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="w-full px-4 pb-24">
                <div className="w-full max-w-3xl mx-auto">

                    {/* Upload Zone */}
                    {state === "idle" && (
                        <div
                            {...getRootProps()}
                            role="button"
                            aria-label="Upload a car part image — drag and drop or click to select"
                            className={cn(
                                "rounded-2xl border-2 border-dashed bg-card shadow-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200",
                                isDragActive
                                    ? "border-primary bg-primary/5 scale-[1.01]"
                                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                            )}
                        >
                            <input {...getInputProps()} />
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                {isDragActive ? (
                                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                                ) : (
                                    <Camera className="h-8 w-8 text-primary" />
                                )}
                            </div>
                            <p className="text-lg font-semibold text-foreground mb-2">
                                {isDragActive ? "Drop it here!" : "Upload a Part Photo"}
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Drag & drop an image, or click to select. Max 10MB.
                            </p>
                            <Button variant="outline" size="sm" className="pointer-events-none">
                                <Upload className="h-4 w-4 mr-2" /> Choose File
                            </Button>
                            {dropError && (
                                <p className="mt-4 text-sm text-destructive font-medium" role="alert">
                                    {dropError}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Processing State */}
                    {(state === "uploading" || state === "analyzing") && preview && (
                        <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
                            <div className="relative aspect-video w-full bg-muted">
                                <img
                                    src={preview}
                                    alt="Uploaded car part"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                                        <Loader className="h-7 w-7 text-white animate-spin" />
                                    </div>
                                    <p className="text-white font-medium text-lg">
                                        {state === "uploading" ? "Uploading image..." : "AI is analyzing your part..."}
                                    </p>
                                    <p className="text-white/60 text-sm">This usually takes a few seconds</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {state === "result" && result && preview && (
                        <div className="space-y-6">
                            {/* Image + Diagnosis Header */}
                            <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
                                <div className="grid md:grid-cols-[280px_1fr]">
                                    {/* Image */}
                                    <div className="relative aspect-square md:aspect-auto bg-muted">
                                        <img
                                            src={preview}
                                            alt={result.partName}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    {/* Diagnosis Card */}
                                    <div className="p-6 flex flex-col">
                                        {isLowConfidence && (
                                            <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                                    Low confidence — this may not be a recognizable car part, or the image may be unclear.
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium tracking-wider text-primary uppercase">
                                                {result.category}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-bold font-heading text-foreground mb-3">
                                            {result.partName}
                                        </h2>

                                        {/* Confidence */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div
                                                className="flex-1 h-2 bg-muted rounded-full overflow-hidden"
                                                role="progressbar"
                                                aria-valuenow={result.confidence}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-label="Identification confidence"
                                            >
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-500", confidenceBarColor)}
                                                    style={{ width: `${result.confidence}%` }}
                                                />
                                            </div>
                                            <span className={cn("text-sm font-bold tabular-nums", confidenceColor)}>
                                                {result.confidence}%
                                            </span>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-start gap-3">
                                                <Wrench className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Function</p>
                                                    <p className="text-sm text-foreground">{result.function}</p>
                                                </div>
                                            </div>

                                            {result.estimatedVehicle && (
                                                <div className="flex items-start gap-3">
                                                    <Car className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vehicle Match</p>
                                                        <p className="text-sm text-foreground">{result.estimatedVehicle}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-3">
                                                <Brain className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">How we identified it</p>
                                                    <p className="text-sm text-muted-foreground">{result.reasoning}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t">
                                            <a
                                                href={addAmazonAffiliateTag(
                                                    `https://www.amazon.com/s?k=${encodeURIComponent(result.amazonSearchTerm)}`
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => trackEvent("amazon_click", { product: result.partName })}
                                                className="flex-1"
                                            >
                                                <Button className="w-full gap-2" size="lg">
                                                    <Image
                                                        src="/amazon-logo.png"
                                                        alt="Amazon"
                                                        width={70}
                                                        height={21}
                                                        className="h-4 w-auto object-contain"
                                                    />
                                                    <span>Find on Amazon</span>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </a>
                                            <Button variant="outline" size="lg" onClick={handleReset} className="gap-2">
                                                <RotateCcw className="h-4 w-4" /> Try Another Part
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {state === "error" && (
                        <div className="rounded-2xl border bg-card shadow-lg p-8 text-center">
                            {preview && (
                                <div className="w-32 h-32 mx-auto mb-6 rounded-xl overflow-hidden bg-muted">
                                    <img src={preview} alt="Uploaded image" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Analysis Failed</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                                {error || "Something went wrong. Please try again with a different image."}
                            </p>
                            <Button onClick={handleReset} variant="outline" className="gap-2">
                                <RotateCcw className="h-4 w-4" /> Try Again
                            </Button>
                        </div>
                    )}
                </div>

                {/* Feature Pills */}
                {state === "idle" && (
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
                            <ShieldCheck className="h-4 w-4" />
                            AI-Powered ID
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-sm font-medium text-purple-700">
                            <Tag className="h-4 w-4" />
                            Part + Vehicle Match
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
                            <Sparkles className="h-4 w-4" />
                            Instant Results
                        </div>
                    </div>
                )}

                {/* How It Works — shown only on idle */}
                {state === "idle" && (
                    <div className="mt-16 max-w-3xl mx-auto">
                        <h2 className="text-center font-heading text-xl font-bold text-foreground mb-8">
                            How It Works
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: Camera,
                                    title: "1. Snap or Upload",
                                    desc: "Take a photo of any car part or drag-and-drop an image.",
                                },
                                {
                                    icon: Brain,
                                    title: "2. AI Analyzes",
                                    desc: "Our cascading AI identifies the part using visual cues and 3D shape recognition.",
                                },
                                {
                                    icon: Wrench,
                                    title: "3. Get Results",
                                    desc: "See the part name, function, vehicle match, and where to buy it.",
                                },
                            ].map((step) => (
                                <div
                                    key={step.title}
                                    className="flex flex-col items-center text-center p-6 rounded-xl border bg-card"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                        <step.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
