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

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://visualfitment.com" },
        { "@type": "ListItem", position: 2, name: "Categories", item: "https://visualfitment.com/#categories" },
        { "@type": "ListItem", position: 3, name: "Running Boards & Nerf Bars", item: "https://visualfitment.com/nerf-bars-running-boards" },
    ],
}

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        { "@type": "Question", name: "What's the difference between running boards and nerf bars?", acceptedAnswer: { "@type": "Answer", text: "Running boards are wide, flat platforms for easy step-in access. Nerf bars are round tubes with small step pads — sportier but less foot surface area. Choose running boards for family vehicles and nerf bars for a more athletic look." } },
        { "@type": "Question", name: "Do I need a specific mounting bracket for my truck?", acceptedAnswer: { "@type": "Answer", text: "Yes — brackets are vehicle-specific because each truck has unique rocker panel dimensions and factory mounting points. Most quality kits include the correct brackets for your year, make, and model." } },
        { "@type": "Question", name: "Can I install running boards myself?", acceptedAnswer: { "@type": "Answer", text: "Most bolt-on running boards can be installed in 1–2 hours with basic hand tools — no drilling required with a vehicle-specific kit. You'll need a socket set, a torque wrench, and a friend to help hold the board." } },
        { "@type": "Question", name: "What material is best for running boards?", acceptedAnswer: { "@type": "Answer", text: "Aluminum is lightweight and corrosion-resistant for daily drivers. Stainless steel gives a polished chrome look. Powder-coated steel is toughest for off-road use — it hides trail damage and handles heavy loads." } },
        { "@type": "Question", name: "How does cab size affect running board fitment?", acceptedAnswer: { "@type": "Answer", text: "Cab size determines running board length. Regular cab needs the shortest boards, extended cab needs mid-length, and crew cab needs the longest. The wrong length will either stop short of the rear door or extend past the body." } },
    ],
}

export default function RunningBoardsPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <RunningBoardsClient />
        </>
    )
}
