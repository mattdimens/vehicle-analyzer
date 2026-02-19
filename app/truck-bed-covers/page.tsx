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

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://visualfitment.com" },
        { "@type": "ListItem", position: 2, name: "Categories", item: "https://visualfitment.com/#categories" },
        { "@type": "ListItem", position: 3, name: "Truck Bed Covers", item: "https://visualfitment.com/truck-bed-covers" },
    ],
}

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
            <TruckBedCoversClient />
        </>
    )
}

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        { "@type": "Question", name: "How do I measure my truck bed length?", acceptedAnswer: { "@type": "Answer", text: "Measure from the inside of the bulkhead to the inside of the tailgate, at the floor, with the tailgate closed. Common lengths are 5'7\" (short), 6'4\"–6'6\" (standard), and 8' (long). Or upload a photo — the AI figures it out from the image." } },
        { "@type": "Question", name: "What's the difference between a tonneau cover and a bed cap?", acceptedAnswer: { "@type": "Answer", text: "A tonneau cover sits at bed-rail height and covers the bed opening — it's flat and low-profile. A bed cap is a raised enclosure that adds height and fully encloses the bed like a trunk. Tonneau covers are better for aerodynamics; caps are better for hauling tall cargo." } },
        { "@type": "Question", name: "Do bed covers improve gas mileage?", acceptedAnswer: { "@type": "Answer", text: "Yes, modestly. Studies show tonneau covers can improve fuel economy by 1–3% by reducing aerodynamic drag. Hard flush-mount covers tend to perform better than soft roll-ups." } },
        { "@type": "Question", name: "Can I use a bed cover with a bed liner?", acceptedAnswer: { "@type": "Answer", text: "Most tonneau covers are designed to work alongside both spray-in and drop-in bed liners. Make sure the liner doesn't raise the bed rail height enough to interfere with the cover's clamps or seals." } },
        { "@type": "Question", name: "How does the AI identify my truck bed size?", acceptedAnswer: { "@type": "Answer", text: "The AI analyzes your photo to determine the cab style, which narrows down possible bed lengths. It cross-references visible proportions and known manufacturer configurations to confirm the exact bed size." } },
    ],
}
