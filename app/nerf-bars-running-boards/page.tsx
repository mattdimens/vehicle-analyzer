import type { Metadata } from "next"
import RunningBoardsClient from "./vehicle-analyzer-client"
import { FaqItem } from "@/components/ui/faq-accordion"

export const metadata: Metadata = {
    title: "Running Board & Nerf Bar Analyzer | Visual Fitment",
    description:
        "Upload photos of your truck or SUV to find compatible running boards, nerf bars, and side steps. Advanced analysis ensures correct cab size and mounting compatibility.",
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

export const runningBoardFaqs: FaqItem[] = [
    {
        question: "What's the difference between running boards and nerf bars?",
        answer: "Running boards are wide, flat platforms that run the full length of the cab for easy step-in access. Nerf bars are round tubes (usually 3–4 inches in diameter) with small step pads welded on. They look sportier but offer less foot surface area. Choose running boards for family vehicles and nerf bars for a more athletic aesthetic."
    },
    {
        question: "Do I need a specific mounting bracket for my truck?",
        answer: "Yes, brackets are vehicle-specific because each truck has unique rocker panel dimensions and factory mounting points. Most quality running board kits include the correct brackets for your year, make, and model. Universal brackets exist but may require drilling and don't always fit as securely."
    },
    {
        question: "Can I install running boards myself?",
        answer: "Most bolt-on running boards can be installed in 1–2 hours with basic hand tools, with no drilling required if you use a vehicle-specific kit. You'll typically need a socket set, a torque wrench, and a friend to help hold the board in position while you tighten the bolts."
    },
    {
        question: "What material is best for running boards?",
        answer: "Aluminum is lightweight and corrosion-resistant, ideal for daily drivers especially in salty climates. Stainless steel is heavier but gives a polished chrome look. Powder-coated steel is the toughest option for off-road use; it hides trail damage and handles heavy loads without bending."
    },
    {
        question: "How does cab size affect running board fitment?",
        answer: "Cab size determines the length of running board you need. A regular cab needs the shortest boards, an extended cab needs mid-length, and a crew cab needs the longest. Installing the wrong length means the board either stops short of the rear door or extends awkwardly past the body."
    },
]

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: runningBoardFaqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
        },
    })),
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
            <RunningBoardsClient faqItems={runningBoardFaqs} />
        </>
    )
}
