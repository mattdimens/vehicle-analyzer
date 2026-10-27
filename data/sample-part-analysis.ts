import type { PartSample } from "@/components/home/part-sample-card"

/**
 * The /part-identifier sample result: a copy of the real part result at
 * /r/6a14220e8277 (the photo is public/images/sample-part.jpg), so the page
 * makes no request for it beyond the image. The card links to that result.
 */
export const samplePartAnalysis: PartSample = {
    id: "6a14220e8277",
    imageUrl: "/images/sample-part.jpg",
    part: {
        partName: "Engine Piston",
        category: "Engine",
        function: "Transfers the force of expanding combustion gases inside the cylinder to the crankshaft via the connecting rod to produce rotational power.",
        estimatedVehicle: null,
        confidence: 95,
        amazonSearchTerm: "engine piston",
        reasoning: "Identified by its characteristic cylindrical body, top ring grooves, wrist pin bore, and skirt cutouts typical of internal combustion engine pistons.",
        partNumber: null,
        searchVehicle: null,
        alternatives: [],
        relatedParts: ["piston rings", "wrist pin", "connecting rod"],
        buyingCheck: "Verify the exact cylinder bore size, wrist pin diameter, and piston clearance requirements for your specific engine.",
    },
}
