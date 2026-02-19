import Link from "next/link"
import { ChevronRight } from "lucide-react"

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbNavProps {
    items: BreadcrumbItem[]
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
    return (
        <nav aria-label="Breadcrumb" className="w-full bg-[#002a1c]">
            <div className="container mx-auto px-4 py-3">
                <ol className="flex items-center gap-1.5 text-sm">
                    {items.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                            {i > 0 && (
                                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-white/30" />
                            )}
                            {item.href && i < items.length - 1 ? (
                                <Link
                                    href={item.href}
                                    className="text-white/50 hover:text-white/80 transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-white/70 font-medium">
                                    {item.label}
                                </span>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </nav>
    )
}
