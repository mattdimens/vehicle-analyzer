"use client"

import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"

export default function TruckBedCoversPage() {
    return (
        <VehicleAnalyzer
            title="Truck Bed Cover Analyzer"
            description="Identify your truck's exact bed length and style from a photo. Find the perfect tonneau cover, bed liner, or cap that fits your specific vehicle."
            promptContext="truck bed covers, tonneau covers (hard, soft, roll-up, folding), bed liners, and bed caps"
        />
    )
}
