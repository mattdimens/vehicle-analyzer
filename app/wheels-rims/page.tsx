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

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://visualfitment.com" },
        { "@type": "ListItem", position: 2, name: "Categories", item: "https://visualfitment.com/#categories" },
        { "@type": "ListItem", position: 3, name: "Wheels & Rims", item: "https://visualfitment.com/wheels-rims" },
    ],
}

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        { "@type": "Question", name: "How do I find my vehicle's bolt pattern?", acceptedAnswer: { "@type": "Answer", text: "Your bolt pattern is stamped on the back of each OEM wheel, listed in your owner's manual, or can be measured by counting the lugs and measuring the diameter of the circle they form. The fastest method is to upload a photo — our AI reads bolt pattern directly from the image in seconds." } },
        { "@type": "Question", name: "Can I put larger wheels on my truck?", acceptedAnswer: { "@type": "Answer", text: "You can upsize within limits, but going too large affects speedometer accuracy, may rub on fenders or suspension, and can void your warranty. A safe rule of thumb is to stay within 1 inch of your factory diameter and compensate with a lower-profile tire." } },
        { "@type": "Question", name: "What offset do I need for my vehicle?", acceptedAnswer: { "@type": "Answer", text: "Your ideal offset depends on your vehicle's factory spec — you can find it stamped on the back of your OEM wheel (e.g., ET45). Staying within ±5mm of stock is the safest bet for avoiding rubbing or bearing issues." } },
        { "@type": "Question", name: "How accurate is the AI wheel analysis?", acceptedAnswer: { "@type": "Answer", text: "Our AI identifies bolt patterns and rim sizes with high confidence from clear, well-lit photos — typically within a 91% accuracy range. For critical purchases we recommend confirming specs against your VIN or owner's manual." } },
        { "@type": "Question", name: "Will aftermarket wheels void my warranty?", acceptedAnswer: { "@type": "Answer", text: "Under the Magnuson-Moss Warranty Act, a dealer can't void your entire warranty just for installing aftermarket wheels. However, if a wheel-related modification directly causes a failure, that specific repair may not be covered." } },
    ],
}

export default function WheelsAndRimsPage() {
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
            <WheelsRimsClient />
        </>
    )
}
