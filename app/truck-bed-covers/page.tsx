import type { Metadata } from "next"
import TruckBedCoversClient from "./vehicle-analyzer-client"

export const metadata: Metadata = {
    title: "Truck Bed Cover Analyzer | Visual Fitment",
    description:
        "Identify your truck's exact bed length and style from a photo. Find the perfect tonneau cover, bed liner, or cap that fits your specific vehicle.",
    openGraph: {
        title: "Truck Bed Cover Analyzer | Visual Fitment",
        description:
            "Identify your truck's exact bed length and style from a photo. Find the perfect tonneau cover or bed liner.",
        url: "https://visualfitment.com/truck-bed-covers",
        siteName: "Visual Fitment",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Truck Bed Cover Analyzer | Visual Fitment",
        description:
            "Identify your truck's exact bed length and style from a photo. Find the perfect tonneau cover or bed liner.",
    },
    alternates: {
        canonical: "/truck-bed-covers",
    },
}

export default function TruckBedCoversPage() {
    return <TruckBedCoversClient />
}
