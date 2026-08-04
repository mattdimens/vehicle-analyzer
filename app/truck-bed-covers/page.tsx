import type { Metadata } from "next"
import TruckBedCoversClient from "./vehicle-analyzer-client"
import { FaqItem } from "@/components/ui/faq-accordion"

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

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://visualfitment.com" },
        { "@type": "ListItem", position: 2, name: "Categories", item: "https://visualfitment.com/#categories" },
        { "@type": "ListItem", position: 3, name: "Truck Bed Covers", item: "https://visualfitment.com/truck-bed-covers" },
    ],
}

export const bedCoverFaqs: FaqItem[] = [
    {
        question: "How do I measure my truck bed length?",
        answer: "Measure from the inside of the bulkhead (the wall behind the cab) to the inside of the tailgate, at the floor, with the tailgate closed. Common lengths are 5'7\" (short), 6'4\"–6'6\" (standard), and 8' (long). Or skip the tape measure and upload a photo; our analysis figures it out from the image."
    },
    {
        question: "What's the difference between a tonneau cover and a bed cap?",
        answer: "A tonneau cover sits at bed-rail height and covers the bed opening. It's flat, low-profile, and available in soft or hard versions. A bed cap (or camper shell) is a raised enclosure that adds height and fully encloses the bed like a trunk. Tonneau covers are better for aerodynamics; caps are better for hauling tall cargo or camping."
    },
    {
        question: "Do bed covers improve gas mileage?",
        answer: "Yes, modestly. Studies show tonneau covers can improve fuel economy by 1–3% by reducing aerodynamic drag in the bed. Hard flush-mount covers tend to perform better than soft roll-ups, but the savings vary by driving speed and conditions."
    },
    {
        question: "Can I use a bed cover with a bed liner?",
        answer: "Absolutely. Most tonneau covers are designed to work alongside both spray-in and drop-in bed liners. The key is to make sure the liner doesn't raise the bed rail height enough to interfere with the cover's clamps or seals. Drop-in liners with raised edges sometimes need trimming around the mounting points."
    },
    {
        question: "How does the analyzer identify my truck bed size?",
        answer: "Our analysis examines your photo to determine the cab style (crew, extended, regular), which narrows down the possible bed lengths for that model. It cross-references visible proportions and known manufacturer configurations to confirm the exact bed size, giving you a match in seconds."
    },
]

export default function TruckBedCoversPage() {
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
            <TruckBedCoversClient faqItems={bedCoverFaqs} />
        </>
    )
}

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: bedCoverFaqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
        },
    })),
}
