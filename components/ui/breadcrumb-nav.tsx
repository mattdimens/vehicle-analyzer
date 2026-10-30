import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbNavProps {
    items: BreadcrumbItem[]
    /** "light" sits inside a light hero, with no bar or container of its own. */
    variant?: "dark" | "light"
    className?: string
}

const tones = {
    dark: { list: "", separator: "text-white/30", link: "text-white/50 hover:text-white/80", current: "text-white/70" },
    light: { list: "flex-wrap", separator: "text-[#5A6672]/60", link: "text-[#5A6672] hover:text-[#17212B]", current: "text-[#2B3742]" },
}

export function BreadcrumbNav({ items, variant = "dark", className }: BreadcrumbNavProps) {
    const tone = tones[variant]
    const list = (
        <ol className={cn("flex items-center gap-1.5 text-sm", tone.list)}>
            {items.map((item, i) => (
                <li key={i} className="flex items-center gap-1.5">
                    {i > 0 && (
                        <ChevronRight className={cn("h-3.5 w-3.5 flex-shrink-0", tone.separator)} />
                    )}
                    {item.href && i < items.length - 1 ? (
                        <Link
                            href={item.href}
                            className={cn("transition-colors", tone.link)}
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className={cn("font-medium", tone.current)}>
                            {item.label}
                        </span>
                    )}
                </li>
            ))}
        </ol>
    )

    if (variant === "light") {
        return (
            <nav aria-label="Breadcrumb" className={className}>
                {list}
            </nav>
        )
    }
    return (
        <nav aria-label="Breadcrumb" className={cn("w-full bg-[#002a1c]", className)}>
            <div className="container mx-auto px-4 py-3">{list}</div>
        </nav>
    )
}
