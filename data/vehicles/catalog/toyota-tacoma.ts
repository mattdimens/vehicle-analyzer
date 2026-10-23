import type { VehicleCatalog } from "../types"

/**
 * Toyota Tacoma: researched products, picks and product-type guides.
 *
 * Empty until the first research rows are approved.  Rows come from the
 * research Sheet once Matt approves them (docs/vehicle-pages-plan.md,
 * section 4.5), and every product needs a human check of the live Amazon
 * listing first.
 *
 * A generation page switches from the placeholder template to these picks
 * as soon as it has any, so publish a generation's research in one PR.
 */
export const toyotaTacoma: VehicleCatalog = {
  products: [],
  picks: [],
  guides: [],
}
