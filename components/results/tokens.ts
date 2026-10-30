/**
 * Class tokens for the light card system shared by the results pages and the
 * vehicle pages. Plain strings with no "use client", so server components can
 * import them; components/results/result-shell.tsx re-exports them.
 */

export const AFFILIATE_LINK_PROPS = { target: "_blank", rel: "nofollow sponsored noopener" } as const

/**
 * The off-white page behind the cards (results pages, homepage). Orange text
 * directly on it uses #9A3412: #C8460F only reaches AA on white cards.
 */
export const pageBackgroundClass = "bg-[#EEF3F6]"
export const cardClass = "rounded-2xl border border-[#D5DEE5] bg-white p-4"
/** Category label above a result title ("Engine", "Pickup truck"). */
export const eyebrowClass = "text-xs font-semibold uppercase tracking-[0.08em] text-[#9A3412]"
export const sectionTitleClass = "font-heading text-lg font-bold text-[#17212B]"
export const fieldLabelClass = "text-[13px] font-semibold text-[#5A6672]"
export const primaryButtonClass =
    "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#C8460F] px-3 py-2 text-center text-base font-semibold text-white transition-colors hover:bg-[#AD3C0C]"
export const outlineButtonClass =
    "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#17212B] bg-white px-3 py-2 text-center text-[15px] font-semibold text-[#17212B] transition-colors hover:bg-[#F4F7F9]"

/** A pill link or button in a chip rail. Add `aria-current` or `aria-pressed` for the dark state. */
export const chipClass =
    "inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#D5DEE5] bg-white px-3.5 text-sm font-semibold text-[#17212B] transition-colors hover:border-[#17212B] aria-[current]:border-[#17212B] aria-[current]:bg-[#17212B] aria-[current]:text-white aria-pressed:border-[#17212B] aria-pressed:bg-[#17212B] aria-pressed:text-white"
/** Body copy on the light card system. */
export const bodyTextClass = "text-[#2B3742]"
/** Secondary copy: counts, dates, hints. */
export const mutedTextClass = "text-[#5A6672]"
/** The H2 of a vehicle page section. */
export const pageSectionTitleClass = "font-heading text-[22px] font-bold leading-tight text-[#17212B] md:text-2xl"
