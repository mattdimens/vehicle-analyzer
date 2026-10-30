import type { VehicleCatalog } from "../types"

/**
 * Toyota Tacoma: researched products, picks and product-type guides.
 *
 * Rows come from the research Sheet once Matt approves them
 * (docs/vehicle-pages-plan.md, section 4.5), and every product needs a human
 * check of the live Amazon listing first.
 *
 * Picks show above the placeholder template on generation pages and the
 * model hub.  Placeholders tagged with a researched product type
 * (VehicleProduct.productType) drop out.
 */
export const toyotaTacoma: VehicleCatalog = {
  products: [
    // ── Seat covers ──
    {
      id: "covercraft-carhartt-seatsaver-tacoma-2016-2023-front",
      asin: "B01MCRLWD5",
      brand: "Covercraft",
      name: "Carhartt SeatSaver Front Seat Covers",
      category: "seat-covers",
      priceBand: "mid",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2016,
          yearEnd: 2023,
          notes: "Front bucket seats with side airbags.",
        },
      ],
      why: "Carhartt duck canvas that owners say holds up for years and keeps spills from soaking through. It goes in the washing machine.",
      gotcha:
        "The fit is looser than a tailored cover, though owners say it improves after a wash. Covers the two front seats only.",
      sources: [
        "https://www.extremeterrain.com/covercraft-tacoma-carhartt-seatsaver-front-row-seat-cover-mossy-oak-ssc2509camb.html",
        "https://www.tacomaworld.com/threads/gen-3-seat-cover-recommendations.769705/",
        "https://www.tacomaworld.com/threads/carhartt-seat-covers.721638/",
      ],
      verifiedAt: "2026-10-29",
      status: "active",
    },
    {
      id: "covercraft-carhartt-seatsaver-tacoma-2016-2023-rear",
      asin: "B01MF52LSH",
      brand: "Covercraft",
      name: "Carhartt SeatSaver Rear Seat Covers",
      category: "seat-covers",
      priceBand: "mid",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2016,
          yearEnd: 2023,
          cab: ["Double Cab"],
          notes: "40/60 rear bench without a fold-down armrest.",
        },
      ],
      why: "The matching rear set for the Carhartt front covers, so both rows of a Double Cab get the same washable canvas. Headrest covers are included.",
      gotcha:
        "Sold separately from the front pair. Check that your rear bench has no fold-down armrest.",
      sources: [
        "https://www.tacomaworld.com/threads/gen-3-seat-cover-recommendations.769705/",
        "https://www.tacomaworld.com/threads/covercraft-carhartt-seatsaver-seat-covers.791166/",
      ],
      verifiedAt: "2026-10-29",
      status: "active",
    },
    {
      id: "rough-country-neoprene-seat-covers-tacoma-2016-2023-front-rear",
      asin: "B08B43V61L",
      brand: "Rough Country",
      name: "Neoprene Front and Rear Seat Covers",
      category: "seat-covers",
      priceBand: "mid",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2016,
          yearEnd: 2023,
          cab: ["Double Cab"],
          notes: "Front buckets and rear bench.",
        },
      ],
      why: "Neoprene shrugs off water and mud, and one set covers both rows. Owners in a long TacomaWorld review thread say it has kept their factory seats protected.",
      gotcha:
        "Installing the front covers can mean unbolting the seats. Neoprene runs a little warmer than cloth in the sun.",
      sources: [
        "https://www.roughcountry.com/toyota-tacoma-neoprene-seat-cover-set-91031c.html",
        "https://www.tacomaworld.com/threads/rough-country-neoprene-seat-covers-review.678922/",
      ],
      verifiedAt: "2026-10-29",
      status: "active",
    },
    {
      id: "rough-country-neoprene-seat-covers-tacoma-2016-2023-front",
      asin: "B08B44FBCQ",
      brand: "Rough Country",
      name: "Neoprene Front Seat Covers",
      category: "seat-covers",
      priceBand: "budget",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2016,
          yearEnd: 2023,
          cab: ["Double Cab"],
          notes: "Front bucket seats only.",
        },
      ],
      why: "The front half of the Rough Country set, for owners who only need the seats that see the most wear covered.",
      gotcha: "Front row only. Installing it can mean unbolting the seats.",
      sources: [
        "https://www.quadratec.com/p/rough-country/seat-covers-toyota-tacoma-gen3/front-seats-91030",
        "https://www.tacomaworld.com/threads/rough-country-neoprene-seat-covers-review.678922/",
      ],
      verifiedAt: "2026-10-29",
      status: "active",
    },
    {
      id: "ekr-faux-leather-seat-covers-tacoma-2016-2023-double-cab",
      asin: "B085Q1X33D",
      brand: "EKR",
      name: "Custom Fit Faux Leather Seat Covers, Full Set",
      category: "seat-covers",
      priceBand: "mid",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2016,
          yearEnd: 2023,
          cab: ["Double Cab"],
          notes: "Front and rear seats.",
        },
      ],
      why: "A leather look for both rows for much less than slip-on leather covers. Owners with 3rd gen trucks describe the fit as snug.",
      gotcha:
        "It's faux leather, even where the listing says leather. Installing is easier with the front seats out, and there's no console cover.",
      sources: [
        "https://www.tacomaworld.com/threads/seat-covers.793776/page-3",
        "https://www.tacomaworld.com/threads/ekr-seat-covers-before-and-after.878896/",
      ],
      verifiedAt: "2026-10-29",
      status: "active",
    },
    // ── Seat covers: 4th gen (2024+) ──
    {
      id: "ekr-faux-leather-seat-covers-tacoma-2024-2026-double-cab",
      asin: "B0D12C8G1Z",
      brand: "EKR",
      name: "Custom Fit Faux Leather Seat Covers, Full Set (Gas Models)",
      category: "seat-covers",
      priceBand: "mid",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2024,
          yearEnd: 2026,
          cab: ["Double Cab"],
          excludeTrims: ["TRD Pro", "Trailhunter"],
          notes: "Gas models only; EKR sells a separate set for the hybrid. Front and rear seats.",
        },
      ],
      why: "The set 4th gen owners report back on most. They describe the fit as close to factory, and it covers both rows for less than one row of canvas covers.",
      gotcha:
        "Plan on a long install. Owners say some snap holes don't line up, so you may have to cut a slot, and it's faux leather.",
      sources: [
        "https://www.amazon.com/dp/B0D12C8G1Z",
        "https://www.tacoma4g.com/forum/threads/ekr-seat-covers-review-and-thoughts.12458",
        "https://www.tacomaworld.com/threads/clazzio-seat-covers-for-2024.863623",
      ],
      verifiedAt: "2026-10-30",
      status: "active",
    },
    {
      id: "rough-country-neoprene-seat-covers-tacoma-2024-2026-front-rear",
      asin: "B0D6HS9RKW",
      brand: "Rough Country",
      name: "Neoprene Front and Rear Seat Covers",
      category: "seat-covers",
      priceBand: "budget",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2024,
          yearEnd: 2026,
          cab: ["Double Cab"],
          excludeTrims: ["TRD Pro"],
          notes: "Front buckets and a 60/40 rear bench without a fold-down armrest.",
        },
      ],
      why: "The 4th gen version of the neoprene set 3rd gen owners rate well. It shrugs off water and mud and covers both rows for the lowest price here.",
      gotcha:
        "Rough Country says the fit is very snug. Neoprene runs warm, and one owner says an older set lasted about two years.",
      sources: [
        "https://www.roughcountry.com/product/toyota-neoprene-seat-covers-91062",
        "https://www.tacomaworld.com/threads/clazzio-seat-covers-for-2024.863623",
        "https://www.tacomaworld.com/threads/rough-country-neoprene-seat-covers-review.678922/",
      ],
      verifiedAt: "2026-10-30",
      status: "active",
    },
    {
      id: "covercraft-carhartt-seatsaver-tacoma-2024-2026-front",
      asin: "B0DYZJC8CW",
      brand: "Covercraft",
      name: "Carhartt SeatSaver Front Seat Covers",
      category: "seat-covers",
      priceBand: "premium",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2024,
          yearEnd: 2026,
          excludeTrims: ["TRD Pro"],
          notes: "Front bucket seats with seat-mounted airbags.",
        },
      ],
      why: "The 2024 and later version of the Carhartt canvas covers 3rd gen owners recommend. The duck canvas is water repellent, machine washable and made for the seat airbags.",
      gotcha:
        "Front seats only. The matching rear set is sold separately and doesn't fit the hybrid.",
      sources: [
        "https://www.covercraft.com/sku/SSC2615CAGY",
        "https://www.tacomaworld.com/threads/gen-3-seat-cover-recommendations.769705/",
        "https://www.tacomaworld.com/threads/carhartt-seat-covers.721638/",
      ],
      verifiedAt: "2026-10-30",
      status: "active",
    },
    // ── Floor mats: 3rd gen ──
    {
      id: "weathertech-floorliner-tacoma-2018-2023-double-cab-front-rear",
      asin: "B07P6WW1J5",
      brand: "WeatherTech",
      name: "FloorLiners, Front and Rear (4412991, 448722)",
      category: "floor-mats",
      priceBand: "premium",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2018,
          yearEnd: 2023,
          cab: ["Double Cab"],
          notes: "Automatic transmission only. Not for vinyl floors.",
        },
      ],
      why: "Owners pick these for coverage: higher sides that run up the sill and wrap the footwells farther than the factory all-weather mats.",
      gotcha: "Fits 2018 and later trucks only. The material is stiffer than rubber mats.",
      sources: [
        "https://extremeterrain.com/weathertech-tacoma-digitalfit-front-rear-floor-liners-black-4412991-448722.html",
        "https://www.tacomaworld.com/threads/oem-all-weather-floor-mats-vs-weather-tech.790218/page-2",
        "https://www.tacomaworld.com/threads/whats-the-best-floor-matt-for-3rd-gen-tacoma.847749/page-2",
      ],
      verifiedAt: "2026-10-30",
      status: "active",
    },
    {
      id: "3w-floor-mats-tacoma-2016-2023-double-cab",
      asin: "B0CD15B35L",
      brand: "3W",
      name: "All-Weather TPE Floor Mats, Front and Rear",
      category: "floor-mats",
      priceBand: "budget",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2016,
          yearEnd: 2023,
          cab: ["Double Cab"],
          notes: "Automatic transmission only.",
        },
      ],
      why: "Edge-to-edge TPE liners with raised edges for a little over half the price of WeatherTech, and owners say they feel better underfoot than WeatherTech's. Lifetime warranty.",
      gotcha: "Not for manual-transmission trucks, whose driver footwell is shaped differently.",
      sources: [
        "https://www.amazon.com/dp/B0CD15B35L",
        "https://www.tacomaworld.com/threads/all-weather-floor-mat-what-floor-mats-are-you-using.827176/page-2",
      ],
      verifiedAt: "2026-10-30",
      status: "active",
    },
    {
      id: "lasfit-floor-mats-tacoma-2016-2023-double-cab",
      asin: "B0CH2VRV3P",
      brand: "LASFIT",
      name: "All-Weather TPE Floor Mats, Front and Rear",
      category: "floor-mats",
      priceBand: "mid",
      fitment: [
        {
          make: "toyota",
          model: "tacoma",
          yearStart: 2016,
          yearEnd: 2023,
          cab: ["Double Cab"],
          notes: "Automatic transmission only.",
        },
      ],
      why: "Laser-scanned liners that fit every 3rd gen year, including the 2016 and 2017 trucks WeatherTech's set leaves out. Owners who tried them say the fit and coverage are good for the price.",
      gotcha: "Not for manual-transmission trucks.",
      sources: [
        "https://www.amazon.com/dp/B0CH2VRV3P",
        "https://www.tacomaworld.com/threads/all-weather-floor-mat-what-floor-mats-are-you-using.827176/page-4",
      ],
      verifiedAt: "2026-10-30",
      status: "active",
    },
  ],
  picks: [
    {
      make: "toyota",
      model: "tacoma",
      generation: "3rd-gen",
      category: "seat-covers",
      note: "Seat covers are cut for the cab and seat layout, so check whether you have a Double Cab or an Access Cab. If your driver seat is power-adjusted, confirm fit with the seller first: these listings don't say.",
      picks: [
        { productId: "covercraft-carhartt-seatsaver-tacoma-2016-2023-front", role: "best-overall" },
        {
          productId: "covercraft-carhartt-seatsaver-tacoma-2016-2023-rear",
          role: "best-for",
          label: "Best for the Double Cab rear seat",
        },
        {
          productId: "rough-country-neoprene-seat-covers-tacoma-2016-2023-front-rear",
          role: "best-for",
          label: "Best for mud and water",
        },
        { productId: "rough-country-neoprene-seat-covers-tacoma-2016-2023-front", role: "budget" },
        {
          productId: "ekr-faux-leather-seat-covers-tacoma-2016-2023-double-cab",
          role: "best-for",
          label: "Best for a leather look",
        },
      ],
    },
    {
      make: "toyota",
      model: "tacoma",
      generation: "4th-gen",
      category: "seat-covers",
      note: "Covers for the 2024 and later Tacoma are cut for the cab and the rear seat. None of these fit the TRD Pro's IsoDynamic front seats, and the rear sets don't fit a rear bench with a fold-down armrest. Hybrids need a hybrid-specific set.",
      picks: [
        { productId: "ekr-faux-leather-seat-covers-tacoma-2024-2026-double-cab", role: "best-overall" },
        { productId: "rough-country-neoprene-seat-covers-tacoma-2024-2026-front-rear", role: "budget" },
        { productId: "covercraft-carhartt-seatsaver-tacoma-2024-2026-front", role: "premium" },
      ],
    },
    {
      make: "toyota",
      model: "tacoma",
      generation: "3rd-gen",
      category: "floor-mats",
      note: "These are cut for the Double Cab with an automatic transmission. Manual trucks and the Access Cab have a different floor, so check the listing. WeatherTech's set fits 2018 and later only.",
      picks: [
        { productId: "weathertech-floorliner-tacoma-2018-2023-double-cab-front-rear", role: "best-overall" },
        { productId: "3w-floor-mats-tacoma-2016-2023-double-cab", role: "budget" },
        {
          productId: "lasfit-floor-mats-tacoma-2016-2023-double-cab",
          role: "best-for",
          label: "Best for 2016 and 2017 trucks",
        },
      ],
    },
  ],
  guides: [
    {
      make: "toyota",
      model: "tacoma",
      category: "seat-covers",
      intro:
        "Tacoma seat covers are cut for one generation, cab and seat layout, so a set made for a 2016-2023 Double Cab won't fit a 2024 or later truck. These are the covers Tacoma owners recommend, with fitment checked against each brand's listing.",
      buyingNotes: [
        "Covers don't carry over between generations. Covercraft and Rough Country sell separate sets for 2024 and later trucks, so check the years on the listing.",
        "Rear covers are cut for the Double Cab's 40/60 split rear bench. Some front covers fit both the Double Cab and the Access Cab, so check the listing for your cab.",
        "The 3rd gen's front seats have side airbags in the seatbacks. Choose a cover made for seat airbags, so its stitching gives way when an airbag deploys.",
        "If your driver seat is power-adjusted, check fit with the seller first. One owner with a power seat couldn't reach the straps that buckle under it.",
        "Carhartt canvas can go in the washing machine, neoprene handles water and mud best, and faux leather wipes clean but takes the longest to install.",
        "On 2024 and later trucks, the TRD Pro's IsoDynamic front seats take none of these covers, and hybrids have their own rear seat, so buy a set that names the hybrid.",
      ],
    },
  ],
}
