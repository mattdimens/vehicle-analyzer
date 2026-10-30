import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { modelYears } from "@/data/vehicles/index"
import { getGenerationCards } from "@/data/vehicles/catalog"
import type { VehicleMake, VehicleModel } from "@/data/vehicles/types"
import { GenerationCards } from "@/components/vehicles/generation-cards"
import { YearPicker } from "@/components/vehicles/year-picker"

interface ModelBrowseBlockProps {
  make: VehicleMake
  model: VehicleModel
  page: "homepage" | "make"
}

/**
 * A model's way in: year picker, compact generation cards and a link to its
 * hub.  Phones stack them; from 1024px the picker sits left of a single row.
 */
export function ModelBrowseBlock({ make, model, page }: ModelBrowseBlockProps) {
  const basePath = `/vehicles/${make.slug}/${model.slug}`
  const cardsId = `${make.slug}-${model.slug}-generations`
  const generations = getGenerationCards(make.slug, model.slug)

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-5">
      <YearPicker
        modelName={model.name}
        years={modelYears(model.generations)}
        generations={generations.map(({ slug, label, yearStart, yearEnd, displayRange, href }) => ({
          slug,
          label,
          yearStart,
          yearEnd,
          displayRange,
          href,
        }))}
        fallbackHref={`#${cardsId}`}
        page={page}
        showPhotoLink={false}
      />
      <div className="flex min-w-0 flex-col gap-3">
        <GenerationCards generations={generations} variant="compact" id={cardsId} />
        <Link
          href={basePath}
          data-browse-generation="all"
          className="inline-flex min-h-11 items-center gap-1 self-start text-[15px] font-semibold text-[#9A3412] underline-offset-2 hover:text-[#7C2D12] hover:underline"
        >
          All {model.name} accessories
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
