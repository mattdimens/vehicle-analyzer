import type { Metadata } from "next"
import PartIdentifierClient from "./part-identifier-client"

export const metadata: Metadata = {
    title: "Visual Part Identifier — Identify Any Car Part From a Photo | Visual Fitment",
    description:
        "Upload a photo of any car part and instantly identify it with AI. Get the part name, function, vehicle compatibility, and where to buy it.",
    openGraph: {
        title: "Visual Part Identifier — Identify Any Car Part From a Photo | Visual Fitment",
        description:
            "Upload a photo of any car part and instantly identify it with AI. Get the part name, function, and where to buy it.",
        url: "https://visualfitment.com/part-identifier",
        siteName: "Visual Fitment",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Visual Part Identifier | Visual Fitment",
        description:
            "Upload a photo of any car part and instantly identify it with AI.",
    },
    alternates: {
        canonical: "/part-identifier",
    },
}

const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Visual Part Identifier",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    url: "https://visualfitment.com/part-identifier",
    description:
        "AI-powered car part identification tool. Upload a photo of any automotive part and instantly get the part name, category, function, vehicle compatibility, confidence score, and a direct link to purchase on Amazon. Uses Google Gemini vision models with a cascading accuracy strategy.",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
    },
}

export default function PartIdentifierPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
            />
            <PartIdentifierClient />
        </>
    )
}
