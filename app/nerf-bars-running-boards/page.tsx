"use client"

import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"

export default function RunningBoardsPage() {
    return (
        <VehicleAnalyzer
            title="Running Board Analyzer"
            description="Upload photos of your truck or SUV to find compatible running boards, nerf bars, and side steps. AI detection ensures correct cab size and mounting compatibility."
            promptContext="nerf bars, running boards, side steps, rock sliders, and power steps"
        />
    )
}
