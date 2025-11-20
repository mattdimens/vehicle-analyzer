"use client"

import { useState, useRef, useEffect } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader, Crop as CropIcon } from "lucide-react"

interface ImageCropperDialogProps {
    isOpen: boolean
    onClose: () => void
    imageSrc: string | null
    onCropComplete: (croppedFile: File) => void
}

// Helper to center the crop initially
function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export function ImageCropperDialog({
    isOpen,
    onClose,
    imageSrc,
    onCropComplete,
}: ImageCropperDialogProps) {
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const [isProcessing, setIsProcessing] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    // Reset crop when dialog opens
    useEffect(() => {
        if (isOpen) {
            setCrop(undefined)
            setCompletedCrop(undefined)
            setIsProcessing(false)
        }
    }, [isOpen])

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget
        // Start with a centered crop
        setCrop(centerAspectCrop(width, height, 16 / 9))
    }

    async function handleSave() {
        if (!completedCrop || !imgRef.current) return

        setIsProcessing(true)
        try {
            const image = imgRef.current
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            if (!ctx) {
                throw new Error("No 2d context")
            }

            const scaleX = image.naturalWidth / image.width
            const scaleY = image.naturalHeight / image.height

            canvas.width = completedCrop.width * scaleX
            canvas.height = completedCrop.height * scaleY

            ctx.imageSmoothingQuality = "high"

            ctx.drawImage(
                image,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0,
                0,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
            )

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        console.error("Canvas is empty")
                        setIsProcessing(false)
                        return
                    }
                    const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" })
                    onCropComplete(file)
                    onClose()
                },
                "image/jpeg",
                0.95
            )
        } catch (e) {
            console.error("Error cropping image:", e)
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <CropIcon className="w-5 h-5" />
                        Crop & Focus
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-6 bg-muted/30 flex items-center justify-center min-h-[300px]">
                    {imageSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            className="max-h-[60vh]"
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imageSrc}
                                onLoad={onImageLoad}
                                className="max-w-full max-h-[60vh] object-contain"
                            />
                        </ReactCrop>
                    )}
                </div>

                <DialogFooter className="p-6 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!completedCrop || isProcessing}>
                        {isProcessing ? (
                            <>
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Apply Crop"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
