"use client"

import { useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PartResult } from "@/components/home/part-result"
import { SaveToGarageCTA } from "@/components/ui/save-to-garage-cta"
import type { PartIdentification } from "@/app/actions"
import { setPendingPartPhoto } from "@/lib/pending-part-photo"

/** A part identifier result on /r/[id]: the same PartResult the part identifier showed inline. */
export function PartResultView({ part, imageUrl }: { part: PartIdentification; imageUrl: string }) {
    const router = useRouter()
    const photoInputRef = useRef<HTMLInputElement>(null)

    // "Add another photo of this part" / "Try another photo": the picker opens
    // here (it needs the tap), then /part-identifier opens with the photo ready
    const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        setPendingPartPhoto(file)
        router.push("/part-identifier")
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#5A6672]">Your result</p>
                <Link
                    href="/part-identifier"
                    className="flex min-h-11 items-center text-sm font-semibold text-[#9A3412] hover:text-[#7C2D12]"
                >
                    Identify another part
                </Link>
            </div>

            <PartResult
                part={part}
                imageUrl={imageUrl}
                onRequestPhoto={() => photoInputRef.current?.click()}
                showStickyBar
                titleAs="h1"
            />
            <SaveToGarageCTA placement="results" />

            <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
                onChange={handlePhotoSelected}
            />
        </div>
    )
}
