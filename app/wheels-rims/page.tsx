import type { Metadata } from "next"
import WheelsRimsClient from "./vehicle-analyzer-client"

export const metadata: Metadata = {
    title: "Vehicle Wheel & Rim Analyzer | Visual Fitment",
    description:
        "Upload images to identify your vehicle's wheel fitment and find the perfect wheels, rims, and tires. AI-powered bolt pattern and offset analysis.",
    openGraph: {
        title: "Vehicle Wheel & Rim Analyzer | Visual Fitment",
        description:
            "Upload images to identify your vehicle's wheel fitment and find the perfect wheels, rims, and tires.",
        url: "https://visualfitment.com/wheels-rims",
        siteName: "Visual Fitment",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Vehicle Wheel & Rim Analyzer | Visual Fitment",
        description:
            "Upload images to identify your vehicle's wheel fitment and find the perfect wheels, rims, and tires.",
    },
    alternates: {
        canonical: "/wheels-rims",
    },
}

export default function WheelsAndRimsPage() {
    return <WheelsRimsClient />
}
