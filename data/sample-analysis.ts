import type { AnalysisRecord } from "@/types/analysis"

export const sampleAnalysisRecord: AnalysisRecord = {
    id: "bbcgw19u",
    image_url: "https://jktvsbtgwtzsszebzyay.supabase.co/storage/v1/object/public/vehicle_images/0085c835-03b7-4973-861b-e6dcc9abd320.png",
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
            vehicleType: "Pickup Truck"
        },
        engineDetails: "6.2L V8",
        confidence_score: 95,
        otherPossibilities: [
            { trim: "SVT Raptor", vehicle: "Ford F-150", yearRange: "2010-2014", confidence: 15 },
            { trim: "FX4", vehicle: "Ford F-150", yearRange: "2009-2014", confidence: 5 }
        ],
        recommendedAccessories: [
            "Tonneau Cover (e.g. BAKFlip MX4, Rough Country Hard Folding)",
            "Off-Road Lighting (e.g. Baja Designs Squadron Pro, Rigid Industries LED Light Bar)",
            "Performance Exhaust System (e.g. Borla Touring, MBRP 3-Inch Cat-Back)",
            "Floor Liners (e.g. WeatherTech DigitalFit, Husky Liners X-act Contour)"
        ]
    },
    detected_products: [
        { type: "Front Bumper", brand: "Ford", model: "OEM SVT Raptor Front Bumper", confidence: 95 },
        { type: "Grille", brand: "Ford", model: "OEM SVT Raptor Grille", confidence: 95 },
        { type: "Headlights", brand: "Ford", model: "Factory Dark Housing Halogen", confidence: 95 },
        { type: "Fender Flares", brand: "Ford", model: "OEM SVT Raptor", confidence: 95 },
        { type: "Side Steps", brand: "Ford", model: "OEM SVT Raptor Running Boards", confidence: 95 },
        { type: "Wheels", brand: "Ford", model: "17-inch SVT Raptor Cast Aluminum", confidence: 95 },
        { type: "Tires", brand: "BFGoodrich", model: "All-Terrain T/A KO", confidence: 95 }
    ],
    confidence: 95,
    error_details: null,
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
}
