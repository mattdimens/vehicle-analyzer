import type { Metadata } from "next"
import RunningBoardsClient from "./vehicle-analyzer-client"

export const metadata: Metadata = {
    title: "Running Board & Nerf Bar Analyzer | Visual Fitment",
    description:
        "Upload photos of your truck or SUV to find compatible running boards, nerf bars, and side steps. AI detection ensures correct cab size and mounting compatibility.",
    openGraph: {
        title: "Running Board & Nerf Bar Analyzer | Visual Fitment",
        description:
            "Upload photos to find compatible running boards, nerf bars, and side steps for your truck or SUV.",
        url: "https://visualfitment.com/nerf-bars-running-boards",
        siteName: "Visual Fitment",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Running Board & Nerf Bar Analyzer | Visual Fitment",
        description:
            "Upload photos to find compatible running boards, nerf bars, and side steps for your truck or SUV.",
    },
    alternates: {
        canonical: "/nerf-bars-running-boards",
    },
}

export default function RunningBoardsPage() {
    return <RunningBoardsClient />
}
