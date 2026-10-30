import { ChevronDown } from "lucide-react"
import { completeSpecRows } from "@/data/vehicles/index"
import type { VehicleGeneration } from "@/data/vehicles/types"
import { cardClass, mutedTextClass, pageSectionTitleClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

interface GenerationSpecsProps {
  /** e.g. "How the Tacoma generations differ" */
  title: string
  generations: VehicleGeneration[]
}

/**
 * The model hub's comparison: a table from 768px, one disclosure per
 * generation on phones.  Only rows every generation has a value for show,
 * and nothing shows until at least one row is complete.
 */
export function GenerationSpecs({ title, generations }: GenerationSpecsProps) {
  const rows = completeSpecRows(generations)
  if (rows.length === 0) return null

  return (
    <section aria-labelledby="generation-specs-title">
      <h2 id="generation-specs-title" className={pageSectionTitleClass}>
        {title}
      </h2>

      {/* Phones */}
      <div className={cn(cardClass, "mt-4 px-4 py-0 md:hidden")}>
        {generations.map((g) => (
          <details key={g.slug} className="group border-t border-[#EDF1F4] first:border-t-0">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 text-[15px] font-semibold text-[#17212B] [&::-webkit-details-marker]:hidden">
              {g.label} · {g.displayRange}
              <ChevronDown
                className={cn("h-[18px] w-[18px] shrink-0 transition-transform group-open:rotate-180", mutedTextClass)}
                aria-hidden="true"
              />
            </summary>
            <dl className="mb-3.5 grid grid-cols-[96px_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 text-sm">
              {rows.map((row) => (
                <div key={row.key} className="contents">
                  <dt className={mutedTextClass}>{row.label}</dt>
                  <dd className="text-[#17212B]">{g.specs?.[row.key]}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>

      {/* 768px and up */}
      <div className={cn(cardClass, "mt-4 hidden overflow-x-auto p-0 md:block")}>
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr>
              <td className="w-36 px-4 py-3" />
              {generations.map((g) => (
                <th key={g.slug} scope="col" className="px-4 py-3 font-semibold text-[#17212B]">
                  {g.label} <span className={cn("font-medium", mutedTextClass)}>{g.displayRange}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-[#EDF1F4]">
                <th scope="row" className={cn("px-4 py-3 align-top font-semibold", mutedTextClass)}>
                  {row.label}
                </th>
                {generations.map((g) => (
                  <td key={g.slug} className="px-4 py-3 align-top text-[#17212B]">
                    {g.specs?.[row.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
