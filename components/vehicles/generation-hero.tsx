import Link from "next/link"
import { ArrowLeft, Camera } from "lucide-react"
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav"
import type { BreadcrumbItem } from "@/components/ui/breadcrumb-nav"
import {
  bodyTextClass,
  cardClass,
  chipClass,
  eyebrowClass,
  mutedTextClass,
  outlineButtonClass,
} from "@/components/results/tokens"
import { cn } from "@/lib/utils"

export interface GenerationLink {
  href: string
  label: string
  years: string
  current?: boolean
}

interface GenerationHeroProps {
  breadcrumb: BreadcrumbItem[]
  /** Phones show this one link instead of the breadcrumb, e.g. "All Tacoma accessories" */
  back?: { href: string; label: string }
  /** e.g. "Toyota Tacoma · 3rd Gen" */
  eyebrow: string
  h1: string
  intro: string
  /** One link per generation; the current one is marked */
  generations?: { label: string; links: GenerationLink[] }
  /** Right column from 1024px */
  aside?: React.ReactNode
  /** Under 1024px, show the aside under the intro instead of hiding it */
  asideOnMobile?: boolean
}

/** "First sentence." and the rest, for the phone intro. */
function splitIntro(intro: string): [string, string] {
  const end = intro.indexOf(". ")
  return end === -1 ? [intro, ""] : [intro.slice(0, end + 1), intro.slice(end + 2)]
}

/** The light, compact hero of the vehicle pages. */
export function GenerationHero({ breadcrumb, back, eyebrow, h1, intro, generations, aside, asideOnMobile }: GenerationHeroProps) {
  const [first, rest] = splitIntro(intro)

  return (
    <section className="w-full border-b border-[#D5DEE5] bg-[#F4F7F9]">
      <div className="container max-w-6xl py-5 md:py-8">
        <BreadcrumbNav items={breadcrumb} variant="inline" className="mb-5 hidden md:block" />
        {back && (
          <Link
            href={back.href}
            className={cn("-ml-1 mb-3 inline-flex min-h-10 items-center gap-1.5 px-1 text-sm font-semibold md:hidden", bodyTextClass)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {back.label}
          </Link>
        )}

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10">
          <div className="min-w-0">
            <p className={eyebrowClass}>{eyebrow}</p>
            <h1 className="mt-1.5 font-heading text-[28px] font-bold leading-[1.12] text-[#17212B] md:text-[40px] md:leading-[1.08]">
              {h1}
            </h1>

            {/* Phones: the first sentence, the rest behind "More".  768px and up: the whole intro. */}
            {rest ? (
              <details className="vf-open-md vf-inline-md group mt-3 max-w-3xl">
                <summary className={cn("cursor-pointer list-none text-[15px] leading-relaxed md:text-base [&::-webkit-details-marker]:hidden", bodyTextClass)}>
                  {first}{" "}
                  <span className="vf-hide-md font-semibold text-[#9A3412] underline underline-offset-2 group-open:hidden">
                    More
                  </span>
                </summary>
                <p className={cn("text-[15px] leading-relaxed md:text-base", bodyTextClass)}>{rest}</p>
              </details>
            ) : (
              <p className={cn("mt-3 max-w-3xl text-[15px] leading-relaxed md:text-base", bodyTextClass)}>{intro}</p>
            )}

            {generations && (
              <nav aria-label={generations.label} className="mt-5">
                <ul className="vf-rail -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
                  {generations.links.map((g) => (
                    <li key={g.href}>
                      <Link
                        href={g.href}
                        aria-current={g.current ? "page" : undefined}
                        className={cn(chipClass, "group/gen min-h-11 px-4")}
                      >
                        {g.label}
                        <span className={cn("font-medium group-aria-[current]/gen:text-white/75", mutedTextClass)}>
                          {g.years}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          {aside && <div className={cn("mt-6 lg:mt-0 lg:block", !asideOnMobile && "hidden")}>{aside}</div>}
        </div>
      </div>
    </section>
  )
}

interface PhotoCheckCardProps {
  title: string
  line: string
  /** e.g. "Identify my Tacoma" */
  buttonLabel: string
  /** The photo tool to open; the homepage's by default */
  href?: string
  className?: string
}

/** Points visitors who don't know their configuration to the photo tool. */
export function PhotoCheckCard({ title, line, buttonLabel, href = "/#upload-zone", className }: PhotoCheckCardProps) {
  return (
    <aside className={cn(cardClass, "flex flex-col gap-2.5 p-5", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF0E9] text-[#9A3412]">
        <Camera className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="font-heading text-lg font-semibold leading-snug text-[#17212B]">{title}</p>
      <p className={cn("text-sm leading-relaxed", mutedTextClass)}>{line}</p>
      <Link href={href} className={cn(outlineButtonClass, "mt-1")}>
        {buttonLabel}
      </Link>
    </aside>
  )
}
