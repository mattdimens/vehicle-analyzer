import Link from "next/link"
import { ArrowRight } from "lucide-react"

export interface RelatedPageItem {
    title: string
    description: string
    href: string
}

interface RelatedPagesProps {
    items: RelatedPageItem[]
    heading?: string
}

export function RelatedPages({ items, heading = "You Might Also Like" }: RelatedPagesProps) {
    return (
        <section className="w-full bg-gray-50 py-16 border-t border-border/40">
            <div className="container max-w-5xl">
                <h2 className="font-heading text-2xl font-bold text-black mb-8 text-center">
                    {heading}
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {items.map((item, i) => (
                        <Link
                            key={i}
                            href={item.href}
                            className="group flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                        >
                            <div className="flex-1 min-w-0">
                                <h3 className="font-heading text-sm font-semibold text-foreground mb-1 truncate">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                            <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
