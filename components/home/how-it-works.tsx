import { Upload, Table, type LucideIcon } from "lucide-react"
import React from "react"

export interface HowItWorksStep {
    title: string
    description: React.ReactNode
}

interface HowItWorksProps {
    heading?: React.ReactNode
    steps?: HowItWorksStep[]
}

const defaultSteps: HowItWorksStep[] = [
    {
        title: "Upload a Photo",
        description: "Upload a photo of a full vehicle or a close-up of a specific part.",
    },
    {
        title: "Get Instant Results",
        description:
            "In seconds, get a detailed breakdown — vehicle specs, identified parts, and direct links to buy compatible accessories.",
    },
]

// Icons per position — kept consistent across all pages
const defaultIcons: LucideIcon[] = [Upload, Table]
const defaultStyles = [
    "border-2 border-black bg-white",
    "border-2 border-black bg-[#0F172A] text-white",
    "border-2 border-black bg-white",
]

export function HowItWorks({ heading, steps = defaultSteps }: HowItWorksProps) {
    const gridCols = steps.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"

    return (
        <section id="how-it-works" className="w-full bg-white py-16 md:py-20">
            <div className="container max-w-6xl">
                <div className="mb-20 text-center">
                    <h2 className="font-heading text-5xl font-bold text-black">
                        {heading ?? (
                            <>How <span className="italic text-primary">Visual Fitment</span> Works</>
                        )}
                    </h2>
                </div>

                <div className={`grid grid-cols-1 gap-12 ${gridCols} ${steps.length === 2 ? "max-w-4xl mx-auto" : ""}`}>
                    {steps.map((step, i) => {
                        const Icon = defaultIcons[i] ?? defaultIcons[0]
                        const isFirst = i === 0
                        const isLast = i === steps.length - 1

                        return (
                            <div key={i} className="flex flex-col">
                                <div className="relative mb-8 flex h-40 items-center justify-center">
                                    {/* Connector Line (Left) */}
                                    {!isFirst && (
                                        <div className="absolute left-0 top-1/2 hidden h-[2px] w-1/2 -translate-y-1/2 border-t-2 border-dashed border-black md:block" />
                                    )}

                                    <div className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full ${defaultStyles[i] ?? defaultStyles[0]}`}>
                                        <Icon className="h-8 w-8" />
                                    </div>

                                    {/* Connector Line (Right) */}
                                    {!isLast && (
                                        <div className="absolute right-0 top-1/2 hidden h-[2px] w-1/2 -translate-y-1/2 border-t-2 border-dashed border-black md:block" />
                                    )}
                                </div>
                                <div className="border-t border-black pt-6">
                                    <h3 className="mb-3 font-heading text-2xl font-medium">
                                        {step.title}
                                    </h3>
                                    <div className="text-lg leading-relaxed text-muted-foreground">
                                        {step.description}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
