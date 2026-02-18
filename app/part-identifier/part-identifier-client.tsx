"use client"

import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"

export default function PartIdentifierClient() {
    return (
        <VehicleAnalyzer
            title="Visual Part Identifier"
            description="Upload a photo of any car part and let AI instantly identify it — name, function, vehicle compatibility, and where to buy it."
            analysisMode="part"
        />
    )
}
