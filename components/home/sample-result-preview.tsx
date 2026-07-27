import Image from "next/image"
import { ResultsDisplay } from "@/components/home/results-display"
import type { AnalysisResults, DetectedProduct } from "@/app/actions"

/* ------------------------------------------------------------------ */
/*  Sample data – uses the exact types the live tool returns           */
/* ------------------------------------------------------------------ */
const SAMPLE_RESULT: AnalysisResults = {
    primary: {
        make: "Toyota",
        model: "Tacoma",
        year: "2024+",
        trim: "TRD Off-Road",
        cabStyle: "Double Cab",
        bedLength: '5 ft',
        vehicleType: "Truck",
        color: "Bronze Oxide",
        condition: "Excellent",
        confidence: 95,
    },
    engineDetails: "i-FORCE MAX 2.4L Hybrid",
    otherPossibilities: [],
    recommendedAccessories: [
        "Bed rack (bed)",
        "Rock sliders (exterior)",
        "Ditch lights (lighting)",
        "All-weather floor mats (interior)",
        "Recovery boards (off-road)",
    ],
}

const SAMPLE_PRODUCTS: DetectedProduct[] = [
    { type: "Wheels", brand: "Method Race Wheels", model: '701 Trail Series', confidence: 95, reasoning: "Matte black finish with distinctive Method lip and spoke design" },
    { type: "Tires", brand: "Falken", model: "Wildpeak A/T3W", confidence: 95, reasoning: "Aggressive all-terrain tread blocks and sidewall lugs" },
    { type: "Light bar", brand: "Baja Designs", model: "S8 Series 20\"", confidence: 90, reasoning: "Amber backlight and distinct bezel design integrated into the lower bumper" },
    { type: "Recovery point", brand: "Unknown", model: "D-Ring Shackle", confidence: 85, reasoning: "Steel bow shackle mounted to the front recovery point" },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function SampleResultPreview() {
    return (
        <div
            id="sample-result-preview"
            className="w-full max-w-5xl mx-auto px-4 pb-4"
        >
            {/* Eyebrow label directly on hero background */}
            <p className="text-white/60 text-xs font-medium tracking-wide mb-2 uppercase text-center md:text-left">
                Sample result
            </p>

            {/* Light inner card replacing outer wrapper */}
            <div className="bg-[#FCFBF7] rounded-xl p-3 shadow-lg border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
                    {/* Left column: sample image */}
                    <div>
                        <Image
                            src="/images/sample-result-tacoma.jpg"
                            alt="2024 Toyota Tacoma TRD Off-Road"
                            width={460}
                            height={300}
                            className="rounded-lg object-cover w-full h-[120px]"
                        />
                            <p className="text-[11px] text-gray-500 mt-1.5">
                                Example analysis from a single uploaded photo
                            </p>
                        </div>

                        {/* Right column: reused ResultsDisplay in preview mode */}
                        <div className="min-w-0">
                            <ResultsDisplay
                                variant="preview"
                                results={SAMPLE_RESULT}
                                detectedProducts={SAMPLE_PRODUCTS}
                                loadingMessage={null}
                                progress={100}
                                hideSaveActions
                            />
                        </div>
                    </div>
            </div>
        </div>
    )
}
