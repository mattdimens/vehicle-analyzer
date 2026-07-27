/**
 * TrustStrip
 *
 * Single-line plain text strip rendered beneath the hero.
 * Contains a single trust statement with no numbers (counts live in
 * CatalogStatsBar instead).
 */
export function TrustStrip() {
  return (
    <div className="w-full bg-[#003223] pb-4 pt-2">
      <p className="text-center text-sm text-white/60 font-medium tracking-wide max-w-3xl mx-auto px-4">
        Every pick vetted for fitment by enthusiasts.
      </p>
    </div>
  )
}
