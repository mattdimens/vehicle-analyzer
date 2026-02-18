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

export default function PartIdentifierPage() {
    return <PartIdentifierClient />
}
