"use client"

import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"
import type { HowItWorksStep } from "@/components/home/how-it-works"
import type { UseCaseCard } from "@/components/home/use-cases"
import { WheelFitmentGuide } from "@/components/educational/wheel-fitment-guide"
import { FaqAccordion, type FaqItem } from "@/components/ui/faq-accordion"
import { RelatedPages } from "@/components/ui/related-pages"
import { ArrowUpCircle, Eye, ShieldCheck } from "lucide-react"

const steps: [HowItWorksStep, HowItWorksStep, HowItWorksStep] = [
    {
        title: "Snap a Wheel Photo",
        description:
            "Take a clear photo of your vehicle's wheel — close-up or full side view. Our AI works with any angle, whether the car is on the ground, on a lift, or in your driveway.",
    },
    {
        title: "AI Reads Wheel Specs",
        description:
            "Our vision model examines your wheel to determine bolt pattern, rim diameter, width, and offset. It also identifies the vehicle to cross-reference fitment data specific to your make and model.",
    },
    {
        title: "Browse Compatible Wheels",
        description:
            "See a detailed breakdown of your current wheel setup alongside recommendations for compatible aftermarket wheels, rims, and tires — with direct Amazon links to start shopping immediately.",
    },
]

const useCaseCards: UseCaseCard[] = [
    {
        title: "Upgrading Your Wheels",
        desc: "You want to swap the factory 17-inch steel wheels on your Tacoma for something aggressive. Upload a photo of your truck, and the AI identifies your exact bolt pattern and hub bore — so you can confidently shop for 18-inch alloys that bolt right on without adapters.",
        icon: ArrowUpCircle,
    },
    {
        title: "Matching a Look You Saw",
        desc: "A blacked-out Wrangler rolled past you with the perfect wheel and tire combo. You grabbed a quick photo — now upload it and the AI identifies the rim style and approximate tire size, giving you a shopping list to recreate that exact stance on your own Jeep.",
        icon: Eye,
    },
    {
        title: "Verifying Specs Before Purchase",
        desc: "You found a deal on used wheels, but the seller's listing just says '20-inch rims.' Upload the seller's photo and the AI will break down the full specs — diameter, width, bolt pattern, and offset — so you know if they'll actually fit before you drive across town.",
        icon: ShieldCheck,
    },
]

const wheelFaqs: FaqItem[] = [
    {
        question: "How do I find my vehicle's bolt pattern?",
        answer: "Your bolt pattern is stamped on the back of each OEM wheel, listed in your owner's manual, or can be measured by counting the lugs and measuring the diameter of the circle they form. The fastest method is to upload a photo here — our AI reads bolt pattern directly from the image in seconds."
    },
    {
        question: "Can I put larger wheels on my truck?",
        answer: "You can upsize within limits, but going too large affects speedometer accuracy, may rub on fenders or suspension, and can void your warranty. A safe rule of thumb is to stay within 1 inch of your factory diameter and compensate with a lower-profile tire to keep the overall rolling diameter close to stock."
    },
    {
        question: "What offset do I need for my vehicle?",
        answer: "Your ideal offset depends on your vehicle's factory spec — you can find it stamped on the back of your OEM wheel (e.g., ET45). Going more positive tucks the wheel inward, while more negative pushes it out. Staying within ±5mm of stock is the safest bet for avoiding rubbing or bearing issues."
    },
    {
        question: "How accurate is the AI wheel analysis?",
        answer: "Our AI identifies bolt patterns and rim sizes with high confidence from clear, well-lit photos — typically within a 91% accuracy range. For critical purchases we always recommend confirming specs against your VIN or owner's manual, but the tool gives you an excellent starting point."
    },
    {
        question: "Will aftermarket wheels void my warranty?",
        answer: "Under the Magnuson-Moss Warranty Act, a dealer can't void your entire warranty just for installing aftermarket wheels. However, if a wheel-related modification directly causes a failure (like an incorrect bolt pattern damaging the hub), that specific repair may not be covered."
    },
]

export default function WheelsRimsClient() {
    return (
        <VehicleAnalyzer
            title="Vehicle Wheel & Rim Analyzer"
            description="Whether you're hunting for the perfect wheel package or trying to match a setup you saw at a meet, upload your photo. We'll break down the bolt pattern, offset, and rim specs so you can shop with confidence — no more guessing if they'll fit."
            promptContext="wheels, rims, tires, lug nuts, and hubcaps"
            categoryLabel="Wheels & Rims"
            howItWorksSteps={steps}
            howItWorksHeading={<>How the <span className="italic text-primary">Wheel Analyzer</span> Works</>}
            useCaseCards={useCaseCards}
            useCaseHeading="Why People Use the Wheel Analyzer"
            useCaseSubtitle="Whether you're upgrading, matching a build, or double-checking fitment — the AI does the spec work for you."
            educationalContent={<WheelFitmentGuide />}
            faqContent={<FaqAccordion items={wheelFaqs} />}
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Categories", href: "/#categories" },
                { label: "Wheels & Rims" },
            ]}
            relatedContent={
                <RelatedPages
                    items={[
                        {
                            title: "Truck Bed Covers",
                            description: "Get the right tonneau cover by identifying your bed length and cab style.",
                            href: "/truck-bed-covers"
                        },
                        {
                            title: "Running Boards",
                            description: "Find side steps and nerf bars that fit your truck's cab configuration.",
                            href: "/nerf-bars-running-boards"
                        },
                        {
                            title: "Visual Part Identifier",
                            description: "Identify loose parts or unknown components from a quick photo.",
                            href: "/part-identifier"
                        }
                    ]}
                />
            }

        />
    )
}
