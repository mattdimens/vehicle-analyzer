import Link from "next/link"
import { getAllMakes } from "@/data/vehicles/index"
import { isVehicleSupported } from "@/data/vehicles/supported-vehicles"
import { BrowseClickTracking } from "@/components/home/browse-click-tracking"
import { ModelBrowseBlock } from "@/components/vehicles/model-browse-block"
import { mutedTextClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

/**
 * "Browse by vehicle" homepage section: one block per supported model, from
 * the data, so a new vehicle family appears here when its pages ship.
 *
 * Rendered on the server: it reads the catalog, and every link is in the HTML.
 */
export function BrowseByVehicle() {
  const models = getAllMakes().flatMap((make) =>
    make.models.filter((model) => isVehicleSupported(make.name, model.name)).map((model) => ({ make, model }))
  )

  return (
    <section id="browse-by-vehicle" className="w-full py-16 md:py-20">
      <div className="container max-w-6xl">
        <div className="mb-10 text-center md:mb-12">
          <h2 className="font-heading text-4xl font-bold text-[#17212B] md:text-5xl">
            Browse by{" "}
            <span className="text-[#C8460F] italic">
              vehicle
            </span>
          </h2>
          <p className={cn("mt-4 text-lg max-w-2xl mx-auto", mutedTextClass)}>
            Pick your generation to see fitment-checked picks and Amazon searches for your years.
          </p>
        </div>

        <BrowseClickTracking>
          <div className="flex flex-col gap-10">
            {models.map(({ make, model }) => (
              <div key={`${make.slug}-${model.slug}`} className="flex flex-col gap-4">
                <p className="font-heading text-xl font-bold text-[#17212B] md:text-2xl">
                  {make.name} {model.name}
                </p>
                <ModelBrowseBlock make={make} model={model} page="homepage" />
              </div>
            ))}
          </div>
        </BrowseClickTracking>

        <p className={cn("mt-8 text-center text-[15px]", mutedTextClass)}>
          Not sure which generation you have?{" "}
          <Link href="#upload-zone" className="font-semibold text-[#9A3412] underline underline-offset-2 hover:text-[#7C2D12]">
            Upload a photo
          </Link>{" "}
          above.
        </p>
      </div>
    </section>
  )
}
