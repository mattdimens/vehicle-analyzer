"use client"

import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"

export default function WheelsAndRimsPage() {
    return (
        <VehicleAnalyzer
            title="Vehicle Wheel & Rim Analyzer"
            description="Upload images to identify your vehicle's fitment and find the perfect wheels, rims, and tires. Get AI-powered recommendations based on your bolt pattern and offset."
            promptContext="wheels, rims, tires, lug nuts, and hubcaps"
        />
    )
}
