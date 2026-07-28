/**
 * Test fixture: bbcgw19u analysis record.
 *
 * This is the exact shape returned by the /api/analyses/bbcgw19u endpoint.
 * Used to validate rendering against the real data contract and to prevent
 * regressions where the UI reads from wrong field paths.
 */
import type { AnalysisRecord } from "@/types/analysis"

export const bbcgw19uFixture: AnalysisRecord = {
    id: "bbcgw19u",
    image_url: "https://example.supabase.co/storage/v1/object/public/vehicle_images/0085c835-test.png",
    status: "complete",
    result_data: {
        primary: {
            make: "Ford",
            trim: "SVT Raptor",
            year: "2014",
            color: "Black",
            model: "F-150",
            cabStyle: "SuperCrew",
            bedLength: "67.0\" (Short)",
            condition: "used",
            confidence: 95,
            vehicleType: "Pickup Truck",
        },
        engineDetails: "6.2L V8",
        confidence_score: 95,
        otherPossibilities: [
            {
                trim: "SVT Raptor",
                vehicle: "Ford F-150",
                yearRange: "2010-2014",
                confidence: 15,
            },
        ],
        recommendedAccessories: [
            "Tonneau Cover (e.g. BAKFlip MX4, Rough Country Hard Folding)",
            "LED Light Bar (e.g. Rigid Industries, KC HiLiTES)",
            "Running Boards (e.g. N-Fab, AMP Research PowerStep)",
            "Fender Flares (e.g. Bushwacker Pocket Style)",
        ],
        seo_optimized_alt_text: "Black 2014 Ford F-150 SVT Raptor SuperCrew pickup truck",
    },
    detected_products: [
        { type: "Front Bumper", brand: "Ford", model: "OEM SVT Raptor Front Bumper", reasoning: "Factory Raptor bumper with integrated fog lights", confidence: 95 },
        { type: "Wheels", brand: "Ford", model: "OEM SVT Raptor Forged Wheels", reasoning: "Factory 17-inch beadlock-capable wheels", confidence: 92 },
        { type: "Tires", brand: "BFGoodrich", model: "All-Terrain T/A KO2", reasoning: "Standard Raptor tire fitment", confidence: 88 },
        { type: "Fender Flares", brand: "Ford", model: "OEM SVT Raptor Fender Flares", reasoning: "Factory wide-body flares", confidence: 90 },
        { type: "Grille", brand: "Ford", model: "OEM SVT Raptor Grille", reasoning: "FORD letter grille", confidence: 97 },
        { type: "Skid Plate", brand: "Ford", model: "OEM Raptor Skid Plate", reasoning: "Factory underbody protection", confidence: 85 },
        { type: "Exhaust", brand: "Unknown", model: "Unknown", reasoning: "Dual exhaust tips visible, could not identify brand", confidence: 40 },
    ],
    confidence: 95,
    error_details: null,
    user_id: null,
    created_at: "2026-07-27T20:00:00Z",
    updated_at: "2026-07-27T20:01:00Z",
}

/**
 * Variant with optional fields removed to test defensive rendering.
 */
export const bbcgw19uMinimalFixture: AnalysisRecord = {
    ...bbcgw19uFixture,
    id: "bbcgw19u-minimal",
    result_data: {
        primary: {
            make: "Ford",
            model: "F-150",
            year: "2014",
            confidence: 95,
            // trim, cabStyle, bedLength, vehicleType, color, condition all absent
        },
        // engineDetails absent
        // otherPossibilities absent
        recommendedAccessories: [
            "Tonneau Cover (e.g. BAKFlip MX4)",
        ],
    },
}
