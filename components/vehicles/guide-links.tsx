import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { mutedTextClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

export interface GuideLink {
  title: string
  slug: string
  description: string
}

/** Blog guides for truck accessory pages (the model hub and generation pages). */
export const truckGuides: GuideLink[] = [
  {
    title: "Choosing the Right Tonneau Cover",
    slug: "choosing-the-right-tonneau-cover",
    description: "Tri-fold, roll-up, or retractable? A practical comparison of every bed cover style.",
  },
  {
    title: "Leveling Kit vs. Lift Kit",
    slug: "leveling-kit-vs-lift-kit",
    description: "Understand the trade-offs between a simple level and a full suspension lift.",
  },
  {
    title: "What Is Wheel Offset?",
    slug: "what-is-wheel-offset",
    description: "How offset affects stance, clearance, and bearing wear on trucks and SUVs.",
  },
  {
    title: "Running Boards Buying Guide",
    slug: "running-boards-buying-guide",
    description: "Side steps, nerf bars, and rock sliders: which style fits your cab and use case.",
  },
]

interface GuideLinksProps {
  guides: GuideLink[]
  /** Section id, also the target of an "On this page" link */
  id?: string
  className?: string
}

/** "Guides": one link row per blog post. */
export function GuideLinks({ guides, id = "guides", className }: GuideLinksProps) {
  if (guides.length === 0) return null

  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-[var(--vf-sticky,8rem)]", className)}>
      <h2 id={`${id}-title`} className="font-heading text-lg font-bold text-[#17212B]">
        Guides
      </h2>
      <ul className="mt-2">
        {guides.map((guide) => (
          <li key={guide.slug} className="border-t border-[#EDF1F4] first:border-t-0">
            <Link
              href={`/blog/${guide.slug}`}
              className="flex min-h-12 items-center justify-between gap-3 text-[15px] font-medium text-[#17212B] hover:text-[#9A3412]"
            >
              {guide.title}
              <ChevronRight className={cn("h-4 w-4 shrink-0", mutedTextClass)} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
