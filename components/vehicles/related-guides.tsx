import Link from "next/link"
import { BookOpen, ArrowRight } from "lucide-react"

export interface GuideLink {
  title: string
  slug: string
  description: string
}

interface RelatedGuidesProps {
  guides: GuideLink[]
}

export function RelatedGuides({ guides }: RelatedGuidesProps) {
  if (guides.length === 0) return null

  return (
    <section className="w-full bg-gray-50 py-14 md:py-16 border-t border-border/40">
      <div className="container max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-5 w-5 text-[#1A4D2E]" />
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Related Guides
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/blog/${guide.slug}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#E8712B]/40"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-1 group-hover:text-[#E8712B] transition-colors">
                  {guide.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {guide.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#E8712B] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
