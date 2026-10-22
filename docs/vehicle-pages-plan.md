# Vehicle pages plan: product research, expansion, and Amazon data

Status: approved by Matt 2026-10-22 (all decisions in section 12). Phase 0 engineering is built: catalog, product-type pages, ASIN links, `asin` migration. Written 2026-10-21. Keyword data: Ahrefs, US, pulled 2026-10-21. The raw demand numbers are in [research/vehicle-accessory-demand-2026-10.csv](research/vehicle-accessory-demand-2026-10.csv): one row per vehicle and product type, at 100 or more searches a month and KD 20 or below, with short and make-prefixed phrasings summed.

## Recommendations

1. **Fix the Tacoma pages before building more vehicles.** The four Tacoma generation pages show the same 24 generic product types ("Tri-fold tonneau cover", "Budget roll-up bed cover") with no brands or models. Search Console had them at 251 impressions and 1 click through August. Ahrefs shows zero ranking keywords under `/vehicles` today. Copying this template to 20 more vehicles would multiply thin pages. Rebuild Tacoma with real, fitment-specific Amazon products, measure for 8 weeks, then expand.
2. **Next vehicles, in order:** Jeep Gladiator, Toyota 4Runner and Ford Bronco first. Then Ford F-150, Jeep Wrangler, Ford Maverick, Toyota Tundra and Ram 1500. The ranking is in [section 3](#3-ahrefs-research-results).
3. **Add a vehicle + product type page, like `/vehicles/toyota/tacoma/bed-racks`.** Most of the search demand is there, and none of it is targeted today. "tacoma bed rack" gets 3,700 searches a month. "3rd gen tacoma bed rack" gets 150. Generation pages stay, as hubs for searches like "3rd gen tacoma accessories" and "2025 tacoma accessories".
4. **Keep product data in the repo for now, not Supabase.** Store it as typed data files, restructured into a product catalog plus fitment rules. Use Supabase now only to log which product (ASIN) each click went to. Later, use it to cache live Amazon data once the API is connected. Move the editorial data to Supabase only when one of the triggers in [section 6](#6-product-data-supabase-or-the-repo) happens.
5. **Amazon stays the destination, but links go to product pages instead of searches.** `/go` sends people to `amazon.com/s?k=...` today, a search results page that mixes in parts that don't fit. Add ASIN support to `/go`, and keep search as the fallback.
6. **The Amazon API is worth it later, to keep data fresh. It can't pick products.** PA-API 5.0 has been retired. Its successor, the Creators API, requires 10 qualifying sales in the trailing 30 days. Once you qualify, use it to refresh price, image and availability daily and to flag dead listings. Product selection stays with humans.

## 1. Where the vehicle pages stand

| Item | Today |
|---|---|
| Live URLs | `/vehicles`, `/vehicles/toyota`, `/vehicles/toyota/tacoma`, and 4 generation pages |
| Products | `buildCategories()` in [data/vehicles/toyota.ts](../data/vehicles/toyota.ts) gives every generation the same 8 categories x 3 generic items. Only the intro and the 3 "popular picks" differ by generation. |
| Links | `/go` builds an Amazon search such as `2016-2023 Toyota Tacoma Tri-fold tonneau cover` ([lib/affiliate/merchants.ts](../lib/affiliate/merchants.ts)) |
| Claims | "fitment-verified" appears in 8 places, including meta descriptions. Nothing on the pages is verified yet. |
| Categories | Bed rail caps and door edge guards get product slots. Bed racks, roof racks and seat covers, where the searches are, are buried or missing. |
| Search performance | GSC, 2025-11-11 to 2026-08-02: Tacoma generation pages 251 impressions, 1 click, positions 14 to 54. Ahrefs on 2026-10-21: DR 0, 22 ranking keywords sitewide, all on `/part-identifier` and the trim blog post. None on `/vehicles`. |

The most likely reason the pages don't rank: Google sees four near-duplicate pages listing generic product types, on a site with no links. Phase 0 checks this before anything else.

## 2. Phase 0: the Tacoma pilot

### 2.1 Diagnose (week 1)

1. **Index status.** In Search Console, run URL Inspection on each of the 6 vehicle URLs. Record whether each is indexed, or "Crawled, currently not indexed", or "Duplicate without user-selected canonical". The duplicate status would confirm the thin-template theory.
2. **Per-page queries.** Export the queries for each vehicle URL (Performance, Pages tab, click the URL, Queries tab, Export). Name each file after the page.
3. **First-party demand.** Run the four read-only queries in [section 9](#9-first-party-data-to-pull) in the production SQL editor and share the results.
4. **Tracking IDs.** In Associates Central, under Manage Tracking IDs, create one tracking ID each for vehicle pages, photo results and the blog. Amazon's reports then split earnings by page type. Clicks are already logged per vehicle in `affiliate_clicks`. Revenue per vehicle is only possible through tracking IDs.

### 2.2 Build (weeks 1 to 4)

1. Restructure the product data ([section 6.2](#62-data-shape)) and add ASIN links to `/go` ([section 7](#7-amazon-links-before-the-api)).
2. Research real products for Tacoma ([section 4](#4-product-research-process)). Order: 3rd gen (most trucks on the road, biggest Amazon catalog), then 4th gen (newest, strongest year searches: "2025 tacoma accessories" 700/mo), then 2nd gen, with 1st gen kept light (200/mo, thin Amazon catalog).
3. Reorder each generation's categories by Tacoma demand.
4. Add these Tacoma category pages, ordered by monthly searches. The numbers sum all phrasings, short and with the make.

| Page | Searches/mo | Amazon fit | Note |
|---|---|---|---|
| Bed and tonneau covers | 7,800 | High | "tacoma bed cover" 3,700, "toyota tacoma bed cover" 2,600, "tacoma tonneau cover" 1,500. High order value. |
| Bed racks | 3,700 | Medium | Premium brands mostly sell direct. Amazon has the mid-range. |
| Wheels | 3,300 | Medium | Ties into `/wheels-rims`. Center bore changed for the 4th gen. |
| Roof racks | 3,200 | Medium | |
| Front bumpers and skid plates | 3,400 | Medium | Heavy freight. Amazon covers the budget and mid-range brands. |
| Seat covers | 1,900 | High | |
| Headlights and tail lights | 2,400 | High | |
| Lift and leveling kits | 2,000 | Medium-high | |
| Running boards and rock sliders | 2,200 | High | Ties into `/nerf-bars-running-boards`. |

Skip as their own pages: camper shells (3,200/mo, but almost never sold on Amazon) and tires (800/mo, buyers go to tire retailers). Floor mats (560/mo) stay a section on the generation page.

5. Remove or fix every "fitment-verified" claim that the data doesn't back up.
6. Internal links: model hub to every category page, generation page sections to category pages, and the tonneau and running-board blog posts to the Tacoma category pages.

### 2.3 Gate to expand (8 weeks after launch)

Check at 4 weeks and decide at 8. Expand to Wave 1 if all of these hold:

- Every Tacoma vehicle URL is indexed.
- Tacoma vehicle URLs have at least 3x their baseline impressions, and at least 10 product-type queries ("tacoma bed rack" and so on) rank in the top 20.
- `/go` clicks per vehicle-page view are at or above the sitewide rate (GA4 `affiliate_click` event, `affiliate_clicks` table).
- The vehicle-page tracking ID records at least one Amazon order.

If indexing fails, fix duplication and internal links. If pages are indexed but stuck below position 20, the problem is authority: see the link note in [section 11](#11-risks). Don't expand until one of those is fixed. Research for Wave 1 can run during the 8 weeks. Publishing waits for the gate.

## 3. Ahrefs research results

### 3.1 Method (repeatable)

1. **"Accessories" searches.** For every model since 2005 in [data/vehicles/us-vehicles.ts](../data/vehicles/us-vehicles.ts), check "{model} accessories" and "{make} {model} accessories", plus spelling variants (f150, f-150, f 150). That's 632 phrasings. Use `keywords-explorer-overview`, US, volume of 100 or more.
2. **Product-type grid.** Take the top 24 vehicles and cross them with 33 product types ("tacoma bed rack", "4runner roof rack"). Run both the short name and the make-prefixed name when the short name collides with another product. "Wrangler tires" is mostly Goodyear, "Ranger" is often Polaris, "Maverick" is often Can-Am.
3. **SERP check.** Use `serp-overview` on the head term, one generation term and one product-type term. Record who ranks, their DR, and their page format.
4. **Rank.** Rank vehicles by total monthly searches (accessories searches plus product-type searches at KD 20 or below). Then adjust by judgment for Amazon fit, research effort and fit with the site's photo tools. Re-run steps 1 and 2 every quarter. They cost about 30k Ahrefs units.

### 3.2 What "low to medium difficulty" means here

Ahrefs keyword difficulty (KD) only counts backlinks to the top 10 pages. Almost every vehicle accessory search scores KD 0 to 5, because store category pages that rank have few links pointing at them. So KD doesn't hold this site back. Domain authority and page format do. Rules:

- **Target KD 10 or below now.** Allow 11 to 30 once DR is above 10. Skip anything over 30. Examples to skip: "jeep accessories" (KD 55), "truck accessories" (KD 47), "wrangler accessories" (KD 42).
- **Require a weak spot on page one.** At least one top-10 result should have DR 35 or less. Ahrefs filter: `serp_domain_rating_top10_min`.

### 3.3 What the results pages look like

| Search | Searches/mo | Who ranks | Weakest organic result |
|---|---|---|---|
| tacoma accessories | 5,900 | AI Overview, specialist Shopify stores (Backwoods DR 45, TacomaBeast 40, Tacoma Lifestyle 33), toyota.com, Shopping carousels, People Also Ask | Taco Vinyl, DR 28 |
| 4runner accessories | 3,100 | Same pattern, plus Reddit and 4 Wheel Parts | The Yota Garage, DR 18 |
| ford maverick accessories | 5,200 | ford.com at #1 and #2, Reddit, small stores | Panda Motorworks, DR 17 |
| 3rd gen tacoma accessories | 300 | Small stores and YouTube | Yotaverse, DR 10 |
| 4runner roof rack | 3,500 | LFD Off-Road (DR 19) at #2, Victory 4x4, Reddit, 4Runner Lifestyle | LFD Off-Road, DR 19 |
| jeep gladiator bed cover | 2,900 | Xtrusion (DR 33) at #3, Rough Country, RealTruck, Rugged Ridge, Amazon | Xtrusion, DR 33 |

What this means:

- Low-DR specialist stores hold page one, so the bar can be cleared.
- The winning format is a product listing page: specific products, year ranges in the title, photos. A page of generic product types doesn't match that format.
- Stores only list what they sell. Our edge is picking across brands, stating fitment catches plainly, showing what we see on real trucks in uploaded photos, and the photo tool itself. Reddit threads and People Also Ask questions ("What are the must-have accessories for a Toyota Tacoma?") show people want that kind of curation.
- Generation-specific searches are small, and Ahrefs rolls them up into the model-level search. That's why the new page type is vehicle + product type, with generations as sections inside the page.

### 3.4 Ranked vehicle opportunities

"Accessories" means all phrasings of "{vehicle} accessories". "Product types" means "{vehicle} {product type}" searches at KD 20 or below. Both are monthly US searches. These are lower bounds: only the short name was checked for most vehicles (the make-prefixed name too for Wrangler, Gladiator, Maverick and Ranger). For example, "toyota tacoma bed cover" (2,600) isn't in the Tacoma total.

| # | Vehicle | Accessories | Product types | Total | Largest product types | Wave |
|---|---|---|---|---|---|---|
| 1 | Toyota Tacoma | 12,950 | 36,600 | 49,550 | bed cover 3,700, bed rack 3,700, roof rack 3,200, camper shell 3,200 | Pilot |
| 2 | Jeep Gladiator | 5,250 | 22,550 | 27,800 | bed cover 3,250, wheels 2,200, camper shell 2,200, bed rack 1,750 | 1 |
| 3 | Ford F-150 | 5,050 | 20,800 | 25,850 | bed cover 2,400, wheels 1,700, seat covers 1,500, headlights 1,200 | 2 |
| 4 | Jeep Wrangler | 4,500 | 15,450 | 19,950 | seat covers 1,450, hard top 1,400, roof rack 1,350, wheels 1,300 | 2 |
| 5 | Toyota 4Runner | 5,750 | 12,200 | 17,950 | roof rack 3,500, wheels 1,500, seat covers 700, headlights 700 | 1 |
| 6 | Ford Bronco | 7,000 | 10,850 | 17,850 | roof rack 1,100, wheels 1,000, running boards 700, seat covers 700 | 1 |
| 7 | Ford Maverick | 5,550 | 11,900 | 17,450 | bed cover 1,900, camper shell 1,550, tonneau cover 1,400, wheels 900 | 2 |
| 8 | Ram 1500 | 2,000 | 12,400 | 14,400 | bed cover 1,300, running boards 900, wheels 900, tonneau cover 800 | 2 |
| 9 | Toyota Tundra | 3,240 | 9,800 | 13,040 | bed cover 900, wheels 800, camper shell 700, seat covers 600 | 2 |
| 10 | Ford Ranger | 1,200 | 10,700 | 11,900 | wheels 1,200, bed cover 950, lift kit 800, seat covers 750 | 3 |
| 11 | Tesla Model Y | 6,500 | 3,700 | 10,200 | roof rack 1,000, floor mats 600, wheels 450 | 3 |
| 12 | Chevy Silverado 1500 | 2,150 | 7,200 | 9,350 | wheels 700, bed cover 700, seat covers 600, rims 500 | 3 |
| 13 | Tesla Cybertruck | 2,400 | 5,000 | 7,400 | tires 900, wheels 800, light bar 600, camper shell 600 | 3 |
| 14 | Toyota RAV4 | 2,300 | 4,300 | 6,600 | roof rack 1,000, tires 800, seat covers 600 | 3 |
| 15 | Ford Bronco Sport | 2,700 | 2,750 | 5,450 | lift kit 600, roof rack 400, wheels 300 | 3 |

Below 5,000 a month, not planned: Tesla Model 3, Chevy Tahoe, Honda Ridgeline, Chevy Colorado, Subaru Crosstrek, Jeep Grand Cherokee, Nissan Frontier, GMC Sierra 1500, Subaru Outback.

**Why the waves aren't just the demand order.** Research effort grows with the number of generations. Search demand doesn't. Gladiator (2020+), Bronco (2021+) and Maverick (2022+) each have one generation, so they're the cheapest searches to win. 4Runner shares the Tacoma's aftermarket brands and forums, and has the softest results pages in the sample (DR 18 and 19). F-150 has the third-largest demand, but three generations and many cab and bed combinations make it the most research-heavy truck, so it leads Wave 2. Tesla Model Y has a deep Amazon accessory market, but it's far from the off-road truck audience the photo tools serve, so it's a Wave 3 test.

**Before committing to each vehicle:** run the SERP check from step 3. Confirm a DR 35-or-lower result in the top 10 for the accessories search and for its top two product types. Cross-check against the first-party queries in [section 9](#9-first-party-data-to-pull).

## 4. Product research process

### 4.1 What each section shows

For each vehicle, generation and product type, show 3 to 5 real products, each with a role. "Popular / Budget / Premium" placeholders become:

- **Best overall**
- **Best budget**
- **Premium**
- **Best for {a specific use or configuration}**, for example "Best for the 6-ft bed" or "Best if you also run a roof rack"

### 4.2 Sources, by what each one is trusted for

1. **Fitment: manufacturer fitment guides and part-number lookups.** These are the authority for years, cab, bed length, trim exclusions and drilling. Amazon "Confirmed Fit" (Amazon Garage) is a second check, not the authority.
2. **What owners use and regret: Reddit, model forums and YouTube.** Examples: r/ToyotaTacoma, r/4Runner, r/JeepGladiator, r/Bronco, r/FordMaverickTruck, TacomaWorld, T4R.org, Bronco6G, and "top Amazon mods for X" videos. Extract recommendations, disagreements and catches in owners' own words.
3. **Amazon listing health.** Best Sellers in the subcategory, rating and review count, fitment complaints in Q&A, the "frequently returned" badge, who the seller is, and how long the listing has been up. Ratings are for choosing products only. They can't be displayed without the API ([section 7](#7-amazon-links-before-the-api)).
4. **First-party data.** Brands detected on uploaded photos (`analyses.detected_products`), clicks by category (`affiliate_clicks`) and unsupported vehicles people picked in the selector (`vehicle_selector_events`). The `PopularItem.source: "aggregated"` flag in [data/vehicles/types.ts](../data/vehicles/types.ts) was built for this: a "seen on real Tacomas" module. Show it only when a product was seen at least 5 times.

### 4.3 Selection rules

- In stock on Amazon US, sold by the brand, Amazon or a reputable seller.
- At least 4.3 stars from 200 or more ratings. For vehicles under two model years old, at least 4.0 stars from 50 or more.
- The manufacturer confirms fitment for the exact year range and configuration. Record exclusions.
- At least one owner source recommends it, and owners don't report a recurring problem.
- No more than 2 products from one brand in a section. Budget, mid and premium are all represented.

### 4.4 Fitment fields to record

Years (start and end), cab, bed length, trims included or excluded (TRD Pro, Hybrid, Raptor, Rubicon), drivetrain, and install notes ("drilling required", "not compatible with the factory deck rail system"). The photo pipeline already returns `cabStyle` and `bedLength` (`PrimaryVehicle` in [lib/analysis-stages.ts](../lib/analysis-stages.ts)). Use the same vocabulary, normalized, so the results page can later show picks for the user's exact truck.

### 4.5 Research ledger and review flow

1. Keep a Google Sheet with one tab per vehicle and generation. Columns: product type, role, brand, product name, part number, ASIN, Amazon URL, years, cab, bed, trim notes, why (1 to 2 sentences, specific to the vehicle), catch, owner sources, fitment source URL, Amazon Confirmed Fit (yes or no), rating and review count at check time, price band, checked by, date checked, status (candidate, approved or rejected).
2. A Claude session drafts candidates from forum and web research. It can't reliably reach Amazon from the cloud environment: `affiliate-program.amazon.com` didn't even resolve today. So every row needs a human check of the live Amazon listing (ASIN, fitment, seller) before approval. No row goes live on AI research alone.
3. Matt approves rows. A Claude session turns approved rows into the data file in a PR. Matt checks the Vercel preview, then merges.
4. Effort estimate: about 10 product types x 4 products per generation, at 20 to 30 minutes per product type with verification. That's roughly 4 to 6 hours per generation.

### 4.6 Keeping it current

Review each vehicle every quarter: check that ASINs are still live and in stock, and whether there's a better product. Also review on events: a new model year, a mid-cycle refresh, a recall. Without the API, nobody notices a dead listing between reviews. The API fixes this ([section 8](#8-amazon-creators-api-long-term)).

## 5. Page and URL plan

| Page type | Example URL | Targets | Content |
|---|---|---|---|
| Model hub (exists) | `/vehicles/toyota/tacoma` | "tacoma accessories", "toyota tacoma accessories" | Generation picker, top picks across product types for the current generation, links to every product-type page |
| Generation page (exists) | `/vehicles/toyota/tacoma/3rd-gen` | "3rd gen tacoma accessories", "2016-2023 tacoma accessories", year searches | Product-type sections with 3 to 5 real products each, this generation's fitment catches, "seen on real trucks" |
| Product-type page (new) | `/vehicles/toyota/tacoma/bed-racks` | "tacoma bed rack", "toyota tacoma bed rack", "3rd gen tacoma bed rack" | One section per generation with products, buying criteria specific to the vehicle, owner questions answered in the first two sentences, links to the generation pages and the related blog guide |

**Routing.** Next.js doesn't allow two differently named dynamic segments at the same level. So rename `app/vehicles/[make]/[model]/[generation]` to `[slug]`, and have the page render a generation or a product-type page depending on the slug. Add a unit test that generation slugs and product-type slugs never collide.

**Generation x product-type pages:** don't build them. If one generation's section starts ranking separately in Search Console, split it out then. Example: "3rd gen tacoma front bumper" gets 500/mo against 2,500 for "tacoma front bumper".

**Which product-type pages a vehicle gets:** only types with 300 or more searches a month (all phrasings) and at least 6 vetted products across generations.

**Quality bar for every page** (checked in review, partly enforced by tests):

- At least 6 real products on a product-type page, or at least 3 per section on a generation page. Each has brand, product name, a fitment line, and 1 to 2 sentences on why.
- At least 3 facts specific to the vehicle. Example: "the 2024+ 5-ft bed is a different size from the 2016-2023 bed, so covers don't carry over".
- Title and H1 use the most-searched phrasing plus years. Example: "Toyota Tacoma Bed Racks (2005-2026): Best Picks by Generation".
- A visible "Fitment checked {month year}" line. Keep the `ItemList` markup and don't add `Product` or `Offer` markup (REVIEW.md N5).

**Scale.** Waves 1 and 2 add about 8 vehicles x 8 product-type pages, plus about 15 generation pages and 8 hubs. That's roughly 90 pages. Google's scaled-content policy is the main risk at that size, which is why the quality bar and the gate exist.

## 6. Product data: Supabase or the repo?

**Short answer:** you can use Supabase, since the stack and the dev project are ready. You shouldn't yet for the editorial product data. Keep it in the repo and use Supabase for two narrower jobs.

### 6.1 Why the repo, for now

- Vehicle pages are statically generated from `data/vehicles`. Repo data keeps them static, fast and free of database calls.
- Every change is a reviewed PR with a Vercel preview and an easy rollback. That matches how you already work.
- Types and tests can enforce the rules: fitment years fall inside the generation, ASINs are well formed, no duplicate ASIN in a section, blurbs are non-empty, slugs don't collide.
- No migration cost while the shape is still changing during the pilot. Each database change needs a migration applied to dev and production, plus regenerated types. Cloud sessions can't apply migrations at all.
- The size is fine. Ten vehicles x about 3 generations x 10 product types x 4 products is about 1,200 product-fitment rows.

### 6.2 Data shape

Store products once, with fitment rules, and keep the curation (which product plays which role on which page) separate. A product that fits several generations is entered once. This shape maps directly onto future Supabase tables, so moving later is mechanical. Built in Phase 0; the types in [data/vehicles/types.ts](../data/vehicles/types.ts) are the source of truth.

- **`CatalogProduct`:** id, ASIN, brand, name, product type, price band, fitment entries, why (1 to 2 sentences specific to the vehicle), an optional catch, source URLs, date checked, and status (active or retired).
- **`Fitment`:** make and model slugs, years, and optionally cab styles, bed lengths and excluded trims. These three are written the way they display ("Double Cab", "5-ft", "TRD Pro"), so the card can show them as entered. Plus an optional install note ("Drilling required.").
- **`VehiclePicks`:** the 3 to 5 picks for one product type on one generation page, each with a role (best overall, budget, premium, or "best for" plus a label), and an optional fitment note for that generation.
- **`ProductTypeGuide`:** the intro and at least 3 vehicle-specific buying notes for a product-type page. A page only exists once it has a guide and at least 6 distinct products across generations.

Files: one per model, `data/vehicles/catalog/{make}-{model}.ts`, holding that model's products, picks and guides. Queries are in [data/vehicles/catalog/index.ts](../data/vehicles/catalog/index.ts), kept out of `data/vehicles/index.ts` because a client component imports that module. The rules in [data/vehicles/catalog/validate.ts](../data/vehicles/catalog/validate.ts) run on every build and in `npm test`, so data that breaks one can't deploy.

### 6.3 Supabase now: product-level click logging

Add `asin text` to `affiliate_clicks` in a new migration (`20261022000000`), so clicks and later revenue can be traced to a product. The catalog id isn't logged separately: the ASIN finds the product. Per CLAUDE.md, apply it to the dev project, then to production after merge, and regenerate `types/supabase.ts`. A cloud session can't apply it, so a local session or you will need to.

### 6.4 Supabase later: the Amazon data cache

When the API is connected ([section 8](#8-amazon-creators-api-long-term)), add an `amazon_items` table, refreshed by a scheduled job. Pages read it at render time.

| Column | Notes |
|---|---|
| `asin` (primary key) | |
| `title`, `brand` | From the API |
| `image_url`, `image_width`, `image_height` | A link to Amazon's image, never a stored copy. Links may be kept for up to 24 hours. |
| `price_display`, `currency`, `availability` | From the API's OffersV2 resource |
| `detail_page_url` | |
| `fetched_at` | Pages hide price and image when this is more than 24 hours old |
| `status` | `ok`, `unavailable` or `not_found` |

Access rules: anonymous users can read, and only the service role can write.

### 6.5 Triggers to move the editorial data to Supabase

Move when any of these is true:

- Someone needs to edit products without a PR, for example an admin form or a direct sync from the research Sheet.
- There are more than about 3,000 product-fitment rows, or build time noticeably suffers.
- Runtime features need product queries across many vehicles, for example "products for every vehicle in my garage" in My Garage.

## 7. Amazon links before the API

- **Product links.** Add an `asin` parameter to `/go`. In `merchants.amazon`, when the ASIN matches `^[A-Z0-9]{10}$`, link to `https://www.amazon.com/dp/{ASIN}?tag={tag}`. Otherwise keep today's search link. Log the ASIN. Every link still goes through `/go` with `target="_blank" rel="nofollow sponsored noopener"`.
- **Retired products.** When a product is marked `retired`, it drops off the pages, and `/go` sends old links for its ASIN to an Amazon search for the vehicle, brand and product name, so no link dead-ends.
- **Tracking IDs per page type** ([section 2.1](#21-diagnose-week-1)). Consider tracking IDs per vehicle once there's revenue to split.
- **No prices, star ratings or Amazon images without the API.** As third-party summaries of Amazon's program policies describe them, price and availability may only come from Amazon links or its APIs, and product images may not be stored. Confirm against the current Associates Program Policies text before launch. Keep the brand and category placeholders, and show a price band ($, $$, $$$) instead of a price. Original photos are fine if we take them or have written permission.
- **Commission.** Most sources put the automotive category at about 4.5%. Check the current fee schedule in Associates Central. Amazon's cookie lasts 24 hours and credits the whole cart, so high-priced items convert to the most commission. Bed covers ($300 to $1,200) and running boards are worth prioritizing for that reason.

## 8. Amazon Creators API (long term)

### 8.1 Status as of October 2026

- PA-API 5.0 is retired. Amazon's documentation says calls now return 403, and the Creators API is the successor ([Amazon Creators API docs](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction), [deprecation notice](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation)).
- **Eligibility:** an Associates account in good standing and at least 10 qualifying sales in the past 30 days. Some third-party guides say access is suspended if sales drop below that. Verify in Associates Central.
- **Rate limits:** new credentials start at 1 request per second and 8,640 requests per day, then scale with shipped revenue ([API rates](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/api-rates)). `GetItems` takes up to 10 ASINs per call.
- **Credentials** moved to Login with Amazon. One secondary source says older credentials stopped working on 2026-09-11. Verify when registering.

### 8.2 Does it make sense?

Yes, for keeping data fresh. Not for choosing products.

- **What it's good for:** current price, availability, the main image, title, variations (for example bed-length versions), and catching dead or out-of-stock ASINs every day. Those are exactly the two weak spots of hand-entered data.
- **What it isn't good for:** choosing products. Search results are ranked by Amazon relevance, not by fitment. Amazon Garage fitment data isn't in the API (verify against the API reference). Product choice stays with humans.
- **Cost:** the API is free. The limits are the sales requirement and the rate limits. A daily refresh of 1,200 ASINs is 120 `GetItems` calls, far under 8,640 a day.
- **Timing:** sitewide clicks from search were about 109 in July 2026. Reaching 10 sales a month may take months, so nothing in phases 0 to 3 depends on the API.

### 8.3 Build steps, once eligible

1. Register in Associates Central. Store the credentials in Vercel as server-only variables. Never use the `NEXT_PUBLIC_` prefix. Add them to `.env.example`.
2. Add `lib/amazon/creators-api.ts`, server-only like `lib/analysis-stages.ts`.
3. Add the `amazon_items` migration ([section 6.4](#64-supabase-later-the-amazon-data-cache)), plus a Vercel Cron job that refreshes every 6 to 24 hours.
4. Product cards show "$129.99 at Amazon (as of Oct 21, 2:00 PM)", the Amazon image and availability. Price and image are hidden when the cache is older than 24 hours. Show the timestamp always: the policies reportedly require one next to any price refreshed less often than hourly.
5. A weekly report lists ASINs that have been unavailable for 3 or more days, for replacement. Those links fall back to search automatically.
6. Optional: use `SearchItems` to feed new candidates into the research Sheet for human vetting. Never publish them automatically.
7. Design for losing API access. If sales drop under the threshold, cards fall back to editorial content with no price or image.

## 9. First-party data to pull

Run these in the production Supabase SQL editor. They're read-only.

Unsupported vehicles people asked for:

```sql
select make, model, count(*) as selections, count(distinct session_id) as sessions
from vehicle_selector_events
where supported = false and created_at > now() - interval '180 days'
group by make, model
order by sessions desc
limit 30;
```

Vehicles in uploaded photos:

```sql
select result_data->'primary'->>'make' as make,
       result_data->'primary'->>'model' as model,
       count(*) as analyses
from analyses
where status = 'complete' and created_at > now() - interval '180 days'
group by 1, 2
order by analyses desc
limit 30;
```

Aftermarket products seen on real vehicles (seeds "seen on real trucks"):

```sql
select a.result_data->'primary'->>'model' as vehicle_model,
       p->>'type' as product_type, p->>'brand' as brand, p->>'model' as product_model,
       count(*) as seen
from analyses a, jsonb_array_elements(a.detected_products) p
where a.status = 'complete' and (p->>'confidence')::numeric >= 70
group by 1, 2, 3, 4
order by seen desc
limit 50;
```

Real affiliate clicks by source and category (if `filter_reason` errors, that migration hasn't reached production yet, so delete that condition):

```sql
select source, category, count(*) as clicks
from affiliate_clicks
where filter_reason is null and created_at > now() - interval '90 days'
group by 1, 2
order by clicks desc;
```

## 10. Roadmap

| Phase | When | Work |
|---|---|---|
| 0. Diagnose and set up | Week 1 | Index status, per-page exports, SQL pulls, tracking IDs, research Sheet |
| 0. Engineering | Weeks 1 and 2 | Catalog types and tests, `[slug]` route with product-type pages, ASIN support in `/go`, `affiliate_clicks.asin` migration, sitemap entries, remove unsupported "fitment-verified" claims |
| 1. Tacoma pilot | Weeks 2 to 4 | Research 3rd and 4th gen fully, then 2nd gen, light 1st gen. Publish about 9 product-type pages. |
| 2. Measure | Weeks 5 to 12 | Check at 4 weeks, decide at 8 ([section 2.3](#23-gate-to-expand-8-weeks-after-launch)). Research Wave 1 in parallel. |
| 3. Expand | After the gate | Wave 1: Gladiator, 4Runner, Bronco. Wave 2: F-150, Wrangler, Maverick, Tundra, Ram 1500. Wave 3 as tests. About 1 vehicle every 1 to 2 weeks, set by research capacity. Show catalog picks for supported vehicles on `/r/[id]` above the AI's free-text suggestions. |
| 4. Creators API | At 10 sales in 30 days | [Section 8.3](#83-build-steps-once-eligible) |

**Metrics, per vehicle and per page type:**

| Source | Metrics |
|---|---|
| Search Console | Indexed pages, impressions, average position for the target searches, click-through rate |
| GA4 | `affiliate_click` per page view |
| `affiliate_clicks` | Clicks by vehicle, product type and ASIN |
| Associates reports by tracking ID | Orders, conversion rate, earnings per 1,000 page views |

## 11. Risks

- **Scaled thin content.** Mitigated by the quality bar, the gate, and building product-type pages only where demand and vetted products both exist.
- **Fitment errors** lose trust and cause returns. Manufacturer fitment is the source of truth. Every product shows its exact years, cab and bed, and owners are told to confirm on Amazon's fitment checker before buying.
- **Dead listings** before the API. Quarterly reviews and the search fallback cover them.
- **Policy.** No prices, ratings or stored images without the API. The disclosure stays next to the products. Links stay `nofollow sponsored`.
- **No authority (DR 0).** The pages need some real links. The strongest assets for earning them are original data, for example a post on what we found across hundreds of truck photos, and the free photo tools. Answering owner questions on forums, with a disclosed link where the forum allows it, helps too.

## 12. Decisions for Matt

1. Tacoma first, with the 8-week gate, or expand now?
2. Product data in the repo with the catalog shape above, Supabase only for click logging now and the Amazon cache later?
3. URL pattern `/vehicles/{make}/{model}/{product-type}` for the new pages?
4. Waves: Gladiator, 4Runner and Bronco first?
5. Create the tracking IDs and run the four SQL queries ([section 9](#9-first-party-data-to-pull)).
