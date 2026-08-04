import type { Metadata } from "next"
import WheelsRimsClient from "./vehicle-analyzer-client"
import { FaqItem } from "@/components/ui/faq-accordion"

export const metadata: Metadata = {
    title: "Vehicle Wheel & Rim Analyzer | Visual Fitment",
    description:
        "Upload images to identify your vehicle's wheel fitment and find the perfect wheels, rims, and tires. Advanced bolt pattern and offset analysis.",
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

export const wheelFaqs: FaqItem[] = [
    {
        question: "How do I find my vehicle's bolt pattern?",
        answer: "Your bolt pattern is stamped on the back of each OEM wheel, listed in your owner's manual, or can be measured by counting the lugs and measuring the diameter of the circle they form. The fastest method is to upload a photo here; our analysis reads bolt pattern directly from the image in seconds."
    },
    {
        question: "Can I put larger wheels on my truck?",
        answer: "You can upsize within limits, but going too large affects speedometer accuracy, may rub on fenders or suspension, and can void your warranty. A safe rule of thumb is to stay within 1 inch of your factory diameter and compensate with a lower-profile tire to keep the overall rolling diameter close to stock."
    },
    {
        question: "What offset do I need for my vehicle?",
        answer: "Your ideal offset depends on your vehicle's factory spec. You can find it stamped on the back of your OEM wheel (e.g., ET45). Going more positive tucks the wheel inward, while more negative pushes it out. Staying within ±5mm of stock is the safest bet for avoiding rubbing or bearing issues."
    },
    {
        question: "How accurate is the wheel analysis?",
        answer: "Our analysis identifies bolt patterns and rim sizes with high confidence from clear, well-lit photos, typically within a 91% accuracy range. For critical purchases we always recommend confirming specs against your VIN or owner's manual, but the tool gives you an excellent starting point."
    },
    {
        question: "Will aftermarket wheels void my warranty?",
        answer: "Under the Magnuson-Moss Warranty Act, a dealer can't void your entire warranty just for installing aftermarket wheels. However, if a wheel-related modification directly causes a failure (like an incorrect bolt pattern damaging the hub), that specific repair may not be covered."
    },
]

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: wheelFaqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
        },
    })),
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
            <WheelsRimsClient faqItems={wheelFaqs} />
        </>
    )
}
