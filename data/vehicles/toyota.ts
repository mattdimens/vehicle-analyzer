import type { VehicleMake } from "./types"

/**
 * Toyota vehicle data -- pilot seed.
 *
 * Tacoma generations use verified US model-year boundaries.
 * Each generation has 8 accessory categories with 3 placeholder products
 * (Popular / Budget / Premium).  Every product has a non-empty blurb.
 *
 * Popular picks are editorially curated and flagged source: "editorial".
 */

// ── Helpers ────────────────────────────────────────────────────────────

/** Reusable category template shared across generations. */
function buildCategories(genLabel: string) {
  return [
    {
      slug: "bed",
      name: "Bed & Tailgate",
      products: [
        {
          title: "Tri-fold tonneau cover",
          blurb:
            `A hard tri-fold keeps cargo dry and cuts drag for better highway mileage on your ${genLabel} Tacoma.`,
        },
        {
          title: "Budget roll-up bed cover",
          blurb:
            `An affordable roll-up cover provides basic weather protection without breaking the bank.`,
        },
        {
          title: "Premium retractable tonneau",
          blurb:
            `Flush-mount retractable design with key-lock security for full bed access when you need it.`,
        },
      ],
    },
    {
      slug: "bed-rail",
      name: "Bed Rail",
      products: [
        {
          title: "Bed rail caps",
          blurb:
            `Form-fitted rail caps protect the top edge of your bed from scratches and UV damage.`,
        },
        {
          title: "Budget bed rail protectors",
          blurb:
            `Snap-on rail guards add a layer of scuff protection at a wallet-friendly price.`,
        },
        {
          title: "Premium bed rail tie-down system",
          blurb:
            `Adjustable tie-down tracks let you anchor gear anywhere along the rail without drilling.`,
        },
      ],
    },
    {
      slug: "interior",
      name: "Interior",
      products: [
        {
          title: "All-weather floor mats",
          blurb:
            `Deep-channel mats trap mud, snow, and spills to keep your ${genLabel} Tacoma cabin clean.`,
        },
        {
          title: "Budget seat covers",
          blurb:
            `Affordable neoprene covers shield your factory upholstery from daily wear and tear.`,
        },
        {
          title: "Premium center console organizer",
          blurb:
            `A drop-in tray system turns the deep console bin into compartmentalized storage.`,
        },
      ],
    },
    {
      slug: "exterior",
      name: "Exterior",
      products: [
        {
          title: "Fender flares",
          blurb:
            `Bolt-on flares add tire coverage and a wider stance to your ${genLabel} Tacoma.`,
        },
        {
          title: "Budget mud flaps",
          blurb:
            `No-drill mud flaps reduce road spray and protect your paint from gravel chips.`,
        },
        {
          title: "Premium grille insert",
          blurb:
            `A mesh or heritage-style grille swap updates the front-end look in under an hour.`,
        },
      ],
    },
    {
      slug: "off-road",
      name: "Off-Road & Overland",
      products: [
        {
          title: "Skid plate set",
          blurb:
            `Steel or aluminum underbody armor shields the oil pan, transfer case, and fuel tank on trails.`,
        },
        {
          title: "Budget recovery boards",
          blurb:
            `Lightweight traction boards get you unstuck from sand, mud, or snow without a winch.`,
        },
        {
          title: "Premium roof rack system",
          blurb:
            `A low-profile rack adds cargo space for overland gear without increasing wind noise.`,
        },
      ],
    },
    {
      slug: "lighting",
      name: "Lighting",
      products: [
        {
          title: "LED light bar",
          blurb:
            `A bumper- or roof-mounted LED bar delivers trail-ready visibility in any conditions.`,
        },
        {
          title: "Budget LED pod lights",
          blurb:
            `Compact fog or ditch lights improve side visibility at a fraction of a light bar's cost.`,
        },
        {
          title: "Premium headlight upgrade",
          blurb:
            `Projector-style LED headlights improve throw distance and give your Tacoma a modern look.`,
        },
      ],
    },
    {
      slug: "wheels-tires",
      name: "Wheels & Tires",
      products: [
        {
          title: "All-terrain tire set",
          blurb:
            `A balanced AT tire delivers off-road grip without sacrificing highway comfort or tread life.`,
        },
        {
          title: "Budget steel wheels",
          blurb:
            `Classic steel wheels are tough, affordable, and easy to repair if you bend a rim on the trail.`,
        },
        {
          title: "Premium forged alloy wheels",
          blurb:
            `Lightweight forged wheels reduce unsprung weight for sharper handling and a standout look.`,
        },
      ],
    },
    {
      slug: "protection",
      name: "Protection",
      products: [
        {
          title: "Bull bar",
          blurb:
            `A bolt-on bull bar adds front-end protection and a mounting point for auxiliary lights.`,
        },
        {
          title: "Budget door edge guards",
          blurb:
            `Adhesive-backed edge trim prevents parking-lot dings on every door.`,
        },
        {
          title: "Premium paint protection film",
          blurb:
            `Self-healing PPF on the hood and fenders keeps your paint chip-free for years.`,
        },
      ],
    },
  ]
}

// ── Toyota Make ────────────────────────────────────────────────────────

export const toyota: VehicleMake = {
  slug: "toyota",
  name: "Toyota",
  models: [
    {
      slug: "tacoma",
      name: "Tacoma",
      h1: "Toyota Tacoma Accessories",
      intro:
        "The Tacoma is one of the most accessorized trucks on the road, and for good reason. Whether you are outfitting a brand-new 4th Gen for overlanding or refreshing a first-generation trail rig, the right accessories make it yours. Browse fitment-verified picks across every generation below.",
      generations: [
        // ── 4th Gen ──
        {
          slug: "4th-gen",
          label: "4th Gen",
          yearStart: 2024,
          yearEnd: 2026,
          displayRange: "2024-2026",
          intro:
            "Toyota completely redesigned the Tacoma for 2024 with a new TNGA-F platform, a turbocharged 2.4L four-cylinder, and an available i-FORCE MAX hybrid powertrain. The wider body and coil-rear suspension open up new accessory options that previous generations could not support.",
          categories: buildCategories("4th Gen"),
          popular: [
            {
              title: "Tri-fold tonneau cover",
              brand: undefined,
              blurb: "The most-searched accessory for the new Tacoma, and it is easy to see why: instant bed security with zero-drill install.",
              source: "editorial",
              categorySlug: "bed",
            },
            {
              title: "All-weather floor mats",
              brand: undefined,
              blurb: "Owners in every climate start here. Deep channels trap everything from trail mud to coffee spills.",
              source: "editorial",
              categorySlug: "interior",
            },
            {
              title: "LED light bar",
              brand: undefined,
              blurb: "The wider 4th Gen grille leaves room for a clean light-bar mount without cutting the bumper.",
              source: "editorial",
              categorySlug: "lighting",
            },
          ],
        },
        // ── 3rd Gen ──
        {
          slug: "3rd-gen",
          label: "3rd Gen",
          yearStart: 2016,
          yearEnd: 2023,
          displayRange: "2016-2023",
          intro:
            "The third-generation Tacoma ran for eight model years, making it the most common Tacoma on the road today. Its 3.5L V6 and available crawl control made it a favorite for both daily driving and weekend trail use, with a massive aftermarket catalog to match.",
          categories: buildCategories("3rd Gen"),
          popular: [
            {
              title: "Skid plate set",
              brand: undefined,
              blurb: "TRD Pro owners and trail builders alike upgrade the factory skid coverage for full underbody protection.",
              source: "editorial",
              categorySlug: "off-road",
            },
            {
              title: "All-terrain tire set",
              brand: undefined,
              blurb: "A good AT tire is the single best upgrade for a 3rd Gen Tacoma that splits time between pavement and dirt.",
              source: "editorial",
              categorySlug: "wheels-tires",
            },
            {
              title: "Fender flares",
              brand: undefined,
              blurb: "Wider tires need wider fenders. Bolt-on flares keep your 3rd Gen street-legal and looking intentional.",
              source: "editorial",
              categorySlug: "exterior",
            },
          ],
        },
        // ── 2nd Gen ──
        {
          slug: "2nd-gen",
          label: "2nd Gen",
          yearStart: 2005,
          yearEnd: 2015,
          displayRange: "2005-2015",
          intro:
            "The second-generation Tacoma introduced the frame and 4.0L V6 that earned Toyota's mid-size truck a reputation for longevity. Even with 100k+ miles on the clock, these trucks respond well to bolt-on accessories that refresh both utility and appearance.",
          categories: buildCategories("2nd Gen"),
          popular: [
            {
              title: "Tri-fold tonneau cover",
              brand: undefined,
              blurb: "A tonneau cover is the easiest way to make a high-mileage 2nd Gen look and function like new.",
              source: "editorial",
              categorySlug: "bed",
            },
            {
              title: "Budget seat covers",
              brand: undefined,
              blurb: "After a decade of use, a set of neoprene covers hides wear and protects what is left of the factory cloth.",
              source: "editorial",
              categorySlug: "interior",
            },
            {
              title: "Bull bar",
              brand: undefined,
              blurb: "A steel bull bar adds low-speed protection and gives you a solid mount for off-road lights.",
              source: "editorial",
              categorySlug: "protection",
            },
          ],
        },
        // ── 1st Gen ──
        {
          slug: "1st-gen",
          label: "1st Gen",
          yearStart: 1995,
          yearEnd: 2004,
          displayRange: "1995-2004",
          intro:
            "The original Tacoma replaced the Toyota Pickup and proved a compact truck could be both capable and reliable. Many first-generation trucks are still on the road, and owners keep them running with a mix of restoration parts and modern bolt-on accessories.",
          categories: buildCategories("1st Gen"),
          popular: [
            {
              title: "Premium headlight upgrade",
              brand: undefined,
              blurb: "Factory halogens are dim by modern standards. A projector LED swap transforms nighttime visibility.",
              source: "editorial",
              categorySlug: "lighting",
            },
            {
              title: "All-weather floor mats",
              brand: undefined,
              blurb: "Replace worn-out carpet mats with deep-channel liners that actually keep water off the floor pan.",
              source: "editorial",
              categorySlug: "interior",
            },
            {
              title: "Budget recovery boards",
              brand: undefined,
              blurb: "Lightweight traction boards are cheap insurance for a truck that still sees trail duty after 20+ years.",
              source: "editorial",
              categorySlug: "off-road",
            },
          ],
        },
      ],
    },
  ],
}
