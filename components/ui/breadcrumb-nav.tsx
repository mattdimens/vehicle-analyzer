import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { pageBackgroundClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbNavProps {
    items: BreadcrumbItem[]
    /** "inline" sits inside a hero, with no bar or container of its own. */
    variant?: "bar" | "inline"
    className?: string
}

export function BreadcrumbNav({ items, variant = "bar", className }: BreadcrumbNavProps) {
    const list = (
        <ol className="flex flex-wrap items-center gap-1.5 text-sm">
            {items.map((item, i) => (
                <li key={i} className="flex items-center gap-1.5">
                    {i > 0 && (
                        <ChevronRight className={"h-3.5 w-3.5 flex-shrink-0 text-[#5A6672]/60"} />
                    )}
                    {item.href && i < items.length - 1 ? (
                        <Link
                            href={item.href}
                            className="text-[#5A6672] transition-colors hover:text-[#17212B]"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-medium text-[#2B3742]">
                            {item.label}
                        </span>
                    )}
                </li>
            ))}
        </ol>
    )

    if (variant === "inline") {
        return (
            <nav aria-label="Breadcrumb" className={className}>
                {list}
            </nav>
        )
    }
    return (
        <nav aria-label="Breadcrumb" className={cn("w-full", pageBackgroundClass, className)}>
            <div className="container mx-auto px-4 py-3">{list}</div>
        </nav>
    )
}
