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
      ],
    },
  ],
}
