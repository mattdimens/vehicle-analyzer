"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { HeroSection } from "@/components/home/hero-section"
import { Button } from "@/components/ui/button"
import {
    Upload,
    Loader,
    Camera,
    RotateCcw,
    Wrench,
    Car,
    Brain,
    ExternalLink,
    AlertTriangle,
    Sparkles,
    X,
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
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        const url = URL.createObjectURL(file)
        previewUrlRef.current = url
        setPreview(url)
        setResult(null)
        setError(null)
        setState("uploading")

        trackEvent("part_identifier_upload", { file_type: file.type })

        try {
            const fileName = `part-id/${Date.now()}-${file.name}`
            const signedRes = await createSignedUploadUrl(fileName, file.type)
            if (!signedRes.success) throw new Error(signedRes.error)

            const uploadRes = await fetch(signedRes.data.signedUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            })
            if (!uploadRes.ok) throw new Error("Failed to upload image")

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/vehicle_images/${signedRes.data.path}`

            setState("analyzing")
            trackEvent("part_identifier_start", {})

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
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">
                {/* Green Hero Zone — matches other pages */}
                <div className="bg-[#003223]">
                    <HeroSection
                        title="Visual Part Identifier"
                        description="Snap a photo of any car part and let AI instantly identify it — name, function, vehicle compatibility, and where to buy it."
                    />

                    {/* Upload Zone — same wrapper as other pages */}
                    <div id="upload-zone" className="scroll-mt-20">
                        <div className="w-full px-4 pb-24">
                            <div className="w-full max-w-4xl mx-auto rounded-2xl border bg-card shadow-lg">
                                {/* Idle: Dropzone */}
                                {state === "idle" && (
                                    <div
                                        {...getRootProps()}
                                        role="button"
                                        aria-label="Upload a car part image — drag and drop or click to select"
                                        className={cn(
                                            "min-h-48 w-full p-8 flex flex-col justify-center items-center transition-colors rounded-2xl cursor-pointer",
                                            isDragActive
                                                ? "bg-primary/5"
                                                : "hover:bg-muted/50"
                                        )}
                                    >
                                        <input {...getInputProps()} />
                                        <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                                        <p className="text-lg font-medium text-muted-foreground">
                                            {isDragActive
                                                ? "Drop the image here ..."
                                                : "Drag 'n' drop an image, or click to select"}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Upload a photo of any car part. Max 10MB per file.
                                        </p>
                                        {dropError && (
                                            <p className="mt-4 text-sm text-destructive font-medium" role="alert">
                                                {dropError}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Uploading / Analyzing: Preview with overlay */}
                                {(state === "uploading" || state === "analyzing") && preview && (
                                    <div className="p-4">
                                        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-muted">
                                            <img
                                                src={preview}
                                                alt="Uploaded car part"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                                <Loader className="h-8 w-8 text-white animate-spin" />
                                                <p className="text-white font-medium">
                                                    {state === "uploading" ? "Uploading image..." : "AI is analyzing your part..."}
                                                </p>
                                                <p className="text-white/60 text-sm">This usually takes a few seconds</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error State */}
                                {state === "error" && (
                                    <div className="p-8 text-center">
                                        {preview && (
                                            <div className="w-28 h-28 mx-auto mb-4 rounded-xl overflow-hidden bg-muted">
                                                <img src={preview} alt="Uploaded image" className="w-full h-full object-contain" />
                                            </div>
                                        )}
                                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
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

                                {/* Result: Image preview inside the card */}
                                {state === "result" && result && preview && (
                                    <div className="p-4">
                                        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-muted">
                                            <img
                                                src={preview}
                                                alt={result.partName}
                                                className="w-full h-full object-contain"
                                            />
                                            {/* Small reset button */}
                                            <button
                                                onClick={handleReset}
                                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                                                title="Upload a different image"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Control Bar */}
                                        <div className="flex items-center gap-4 p-4 mt-2 border-t bg-muted/50 rounded-b-xl">
                                            <div className="flex-1" />
                                            <Button onClick={handleReset} className="w-full sm:w-auto gap-2">
                                                <RotateCcw className="h-4 w-4" /> Try Another Part
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section — white background, matches BatchResults section */}
                {state === "result" && result && (
                    <section className="bg-white w-full py-12">
                        <div className="container mx-auto px-4 max-w-4xl">
                            {isLowConfidence && (
                                <div className="flex items-start gap-3 mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        Low confidence — this may not be a recognizable car part, or the image may be unclear.
                                    </p>
                                </div>
                            )}

                            {/* Part Identification Card */}
                            <div className="rounded-2xl border bg-card shadow-sm p-6 md:p-8">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium tracking-wider text-primary uppercase">
                                        {result.category}
                                    </span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground mb-4">
                                    {result.partName}
                                </h2>

                                {/* Confidence Bar */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-20 shrink-0">Confidence</span>
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
                                    <span className={cn("text-sm font-bold tabular-nums w-12 text-right", confidenceColor)}>
                                        {result.confidence}%
                                    </span>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                                        <Wrench className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Function</p>
                                            <p className="text-sm text-foreground">{result.function}</p>
                                        </div>
                                    </div>

                                    {result.estimatedVehicle && (
                                        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                                            <Car className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vehicle Match</p>
                                                <p className="text-sm text-foreground">{result.estimatedVehicle}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className={cn("flex items-start gap-3 p-4 rounded-xl bg-muted/50", !result.estimatedVehicle && "md:col-span-2")}>
                                        <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">How We Identified It</p>
                                            <p className="text-sm text-muted-foreground">{result.reasoning}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Amazon CTA */}
                                <a
                                    href={addAmazonAffiliateTag(
                                        `https://www.amazon.com/s?k=${encodeURIComponent(result.amazonSearchTerm)}`
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackEvent("amazon_click", { product: result.partName })}
                                >
                                    <Button size="lg" className="w-full sm:w-auto gap-2">
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
                            </div>
                        </div>
                    </section>
                )}

                {/* How It Works — matches other pages */}
                {state === "idle" && (
                    <section className="bg-white w-full py-16">
                        <div className="container mx-auto px-4 max-w-4xl">
                            <h2 className="text-center font-heading text-2xl md:text-3xl font-bold text-foreground mb-10">
                                How It Works
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    {
                                        icon: Camera,
                                        step: "01",
                                        title: "Snap or Upload",
                                        desc: "Take a photo of any car part or drag-and-drop an image into the upload zone.",
                                    },
                                    {
                                        icon: Sparkles,
                                        step: "02",
                                        title: "AI Analyzes",
                                        desc: "Our cascading AI engine identifies the part using visual cues, shape, and branding.",
                                    },
                                    {
                                        icon: Wrench,
                                        step: "03",
                                        title: "Get Results",
                                        desc: "See the part name, function, vehicle match, confidence score, and where to buy it.",
                                    },
                                ].map((step) => (
                                    <div
                                        key={step.step}
                                        className="relative flex flex-col items-center text-center p-6"
                                    >
                                        <div className="text-5xl font-bold text-primary/10 font-heading mb-2">{step.step}</div>
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                            <step.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}
