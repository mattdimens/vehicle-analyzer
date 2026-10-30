import { mutedTextClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

/**
 * TrustStrip
 *
 * Single-line plain text strip rendered beneath the hero.
 * Contains a single trust statement with no numbers (counts live in
 * CatalogStatsBar instead).
 */
export function TrustStrip() {
  return (
    <div className="w-full pb-4 pt-2">
      <p className={cn("text-center text-sm font-medium tracking-wide max-w-3xl mx-auto px-4", mutedTextClass)}>
        Identify your vehicle or a part from a photo, then shop accessories for it.
      </p>
    </div>
  )
}
