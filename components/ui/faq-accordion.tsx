"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export interface FaqItem {
    question: string
    answer: string
}

interface FaqAccordionProps {
    items: FaqItem[]
    heading?: string
}

export function FaqAccordion({ items, heading = "Frequently Asked Questions" }: FaqAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className="w-full bg-white py-20">
            <div className="container max-w-3xl">
                <h2 className="font-heading text-3xl font-bold text-black mb-10 text-center">
                    {heading}
                </h2>

                <div className="divide-y divide-border rounded-2xl border shadow-sm overflow-hidden">
                    {items.map((item, i) => (
                        <div key={i} className="bg-card">
                            <button
                                type="button"
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/50"
                                aria-expanded={openIndex === i}
                            >
                                <span className="font-medium text-base text-foreground">
                                    {item.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-200 ${openIndex === i ? "max-h-96" : "max-h-0"
                                    }`}
                            >
                                <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
