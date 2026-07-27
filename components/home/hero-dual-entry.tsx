"use client"

import { useCallback, useRef, useState } from "react"
import { useDropzone } from "react-dropzone"
import Link from "next/link"
import { Upload, Camera, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VehicleSelector } from "@/components/home/vehicle-selector"

/**
 * Dual-entry hero for the homepage.
 *
 * Desktop: photo tool (left) and vehicle selector (right) side by side.
 * Mobile: vehicle selector first, photo tool second.
 *
 * The photo tool side is a simplified single drop zone with one "Analyze
 * My Photo" button. The full UploadZone component is NOT used here; it
 * remains available on sub-pages.
 */

interface HeroDualEntryProps {
  onFilesSelect: (files: File[]) => void
}

export function HeroDualEntry({ onFilesSelect }: HeroDualEntryProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [dropError, setDropError] = useState<string | null>(null)

  const handleCameraSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files))
    }
    e.target.value = ""
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (acceptedFiles) => {
      setDropError(null)
      if (acceptedFiles.length > 0) {
        onFilesSelect(acceptedFiles)
      }
    },
    onDropRejected: (rejections) => {
      const errors = rejections.flatMap((r) => r.errors.map((e) => e.message))
      const unique = [...new Set(errors)]
      if (unique.some((e) => e.includes("larger"))) {
        setDropError("One or more files exceed the 10MB size limit.")
      } else if (unique.some((e) => e.includes("many"))) {
        setDropError("Maximum 10 files allowed per upload.")
      } else {
        setDropError("Only JPEG, PNG, GIF, and WebP images are accepted.")
      }
    },
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 10,
    multiple: true,
  })

  const scrollToUploadZone = useCallback(() => {
    // After files are selected, the main VehicleAnalyzer component handles
    // rendering the full upload zone with the files. We just need to scroll.
    const uploadTarget = document.getElementById("upload-zone")
    if (uploadTarget) {
      uploadTarget.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  return (
    <section
      id="hero"
      className="flex w-full flex-col items-center justify-center px-4 pt-24 pb-8"
    >
      <div className="max-w-5xl w-full">
        {/* Page heading */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-white">
            Find vehicle fitment, parts, &amp; accessories from an image
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-white/80">
            Snap a photo of any vehicle and get a detailed breakdown of specs,
            visible mods, and compatible accessories with links to buy.
          </p>
        </div>

        {/* Two-panel grid: mobile selector-first, desktop photo-left */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicle Selector Panel (mobile: first, desktop: second via order) */}
          <div className="order-1 md:order-2 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-6">
            <VehicleSelector />
          </div>

          {/* Photo Tool Panel (mobile: second, desktop: first via order) */}
          <div className="order-2 md:order-1 rounded-2xl border bg-card shadow-lg overflow-hidden">
            <div
              {...getRootProps()}
              role="button"
              aria-label="Upload vehicle images: drag and drop or click to select"
              className={cn(
                "min-h-[280px] w-full p-6 flex flex-col justify-center items-center transition-colors",
                "rounded-t-2xl",
                isDragActive
                  ? "bg-primary/5 cursor-pointer"
                  : "hover:bg-muted/50 cursor-pointer"
              )}
            >
              <input {...getInputProps()} />

              {/* Desktop: drag and drop */}
              <div className="hidden md:flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  {isDragActive
                    ? "Drop the images here ..."
                    : "Drag and drop images, or click to select"}
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Upload a photo of any vehicle and we will identify make,
                  model, trim, and every visible part and accessory.
                </p>
                {dropError && (
                  <p
                    className="text-sm text-destructive font-medium"
                    role="alert"
                  >
                    {dropError}
                  </p>
                )}
              </div>

              {/* Mobile: buttons */}
              <div className="flex md:hidden flex-col w-full gap-4 py-4">
                <p className="text-sm text-muted-foreground text-center max-w-[500px] mx-auto">
                  Upload a photo of any vehicle and we will identify make,
                  model, trim, and every visible part and accessory.
                </p>
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-semibold shadow-lg rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation()
                    cameraInputRef.current?.click()
                  }}
                >
                  <Camera className="mr-2 h-6 w-6" />
                  Take a Photo
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-base font-medium border-2 border-dashed border-primary/20 hover:bg-primary/5 rounded-xl text-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    open()
                  }}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload from Gallery
                </Button>
                {dropError && (
                  <p
                    className="text-sm text-center text-destructive font-medium"
                    role="alert"
                  >
                    {dropError}
                  </p>
                )}
              </div>

              {/* Hidden camera input */}
              <input
                type="file"
                ref={cameraInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleCameraSelect}
              />
            </div>

            {/* Bottom bar with CTA button and part identifier link */}
            <div className="flex flex-col items-center gap-3 p-4 border-t bg-muted/50 rounded-b-2xl">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  open()
                }}
                className="w-full sm:w-auto"
                size="default"
              >
                Analyze My Photo
                <Send className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Identifying a single part instead?{" "}
                <Link
                  href="/part-identifier"
                  className="text-primary hover:text-primary/80 font-medium underline underline-offset-2"
                >
                  Use the Part Identifier
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
