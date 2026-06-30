import Image from "next/image"
import { ResultsDisplay } from "@/components/home/results-display"
import type { AnalysisResults, DetectedProduct } from "@/app/actions"

/* ------------------------------------------------------------------ */
/*  Sample data – uses the exact types the live tool returns           */
/* ------------------------------------------------------------------ */
const SAMPLE_RESULT: AnalysisResults = {
    primary: {
        make: "Ford",
        model: "F-150 SVT Raptor",
        year: "2011-2014",
        trim: "SVT Raptor",
        cabStyle: "SuperCrew",
        bedLength: '67"',
        vehicleType: "Truck",
        color: "Black",
        condition: "Good",
        confidence: 98,
    },
    engineDetails: "6.2L V8",
    otherPossibilities: [],
    recommendedAccessories: [
        "Tonneau cover",
        "Bed liner",
        "Off-road fog lights",
        "Roof rack",
        "Skid plate",
    ],
}

const SAMPLE_PRODUCTS: DetectedProduct[] = [
    { type: "Wheels", brand: "Ford", model: '17" forged bead-lock', confidence: 95, reasoning: "Distinctive multi-spoke bead-lock design exclusive to SVT Raptor" },
    { type: "Tires", brand: "BFGoodrich", model: "All-Terrain T/A KO", confidence: 95, reasoning: "Tread pattern and sidewall lettering match BFG AT KO series" },
    { type: "Running boards", brand: "SVT", model: "Cast aluminum", confidence: 95, reasoning: "Factory SVT cast aluminum side steps with textured grip" },
    { type: "Grille", brand: "SVT", model: "Raptor grille", confidence: 100, reasoning: "FORD block-letter grille unique to SVT Raptor trim" },
    { type: "Fender flares", brand: "Ford", model: "SVT Raptor OEM", confidence: 90, reasoning: "Extended fender flares with black textured finish" },
    { type: "Skid plate", brand: "Ford", model: "SVT Raptor OEM", confidence: 85, reasoning: "Visible front skid plate typical of Raptor package" },
    { type: "Tow hooks", brand: "Ford", model: "SVT Raptor front tow hooks", confidence: 80, reasoning: "Red-painted front tow hooks standard on SVT Raptor" },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function SampleResultPreview() {
    return (
        <div
            id="sample-result-preview"
            className="w-full max-w-4xl mx-auto px-4 pb-4"
        >
            <div className="bg-[#0D2818] rounded-xl p-4">
                {/* Eyebrow label */}
                <p className="text-white/60 text-xs font-medium tracking-wide mb-2 uppercase">
                    Sample result
                </p>

                {/* Light inner card */}
                <div className="bg-[#FCFBF7] rounded-xl p-3">
                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
                        {/* Left column: sample image */}
                        <div>
                            <Image
                                src="/blog/images/truck-trim-levels-explained-hero.png"
                                alt="Black 2011-2014 Ford F-150 SVT Raptor SuperCrew pickup driving through a forest trail"
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
        </div>
    )
}
