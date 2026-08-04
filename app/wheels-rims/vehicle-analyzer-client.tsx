"use client"

import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"
import type { HowItWorksStep } from "@/components/home/how-it-works"
import type { UseCaseCard } from "@/components/home/use-cases"
import { WheelFitmentGuide } from "@/components/educational/wheel-fitment-guide"
import { FaqAccordion, type FaqItem } from "@/components/ui/faq-accordion"
import { RelatedPages } from "@/components/ui/related-pages"
import { SaveToGarageCTA } from "@/components/ui/save-to-garage-cta"
import { ArrowUpCircle, Eye, ShieldCheck } from "lucide-react"

const steps: HowItWorksStep[] = [
    {
        title: "Snap a Wheel Photo",
        description:
            "Take a clear photo of your vehicle's wheel, either a close-up or full side view. Our analysis works with any angle, whether the car is on the ground, on a lift, or in your driveway.",
    },
    {
        title: "Wheel Specs Identified",
        description:
            "Our vision model examines your wheel to determine bolt pattern, rim diameter, width, and offset. It also identifies the vehicle to cross-reference fitment data specific to your make and model.",
    },
    {
        title: "Browse Compatible Wheels",
        description:
            "See a detailed breakdown of your current wheel setup alongside recommendations for compatible aftermarket wheels, rims, and tires, with direct Amazon links to start shopping immediately.",
    },
]

const useCaseCards: UseCaseCard[] = [
    {
        title: "Upgrading Your Wheels",
        desc: "You want to swap the factory 17-inch steel wheels on your Tacoma for something aggressive. Upload a photo of your truck, and our analysis identifies your exact bolt pattern and hub bore so you can confidently shop for 18-inch alloys that bolt right on without adapters.",
        icon: ArrowUpCircle,
    },
    {
        title: "Matching a Look You Saw",
        desc: "A blacked-out Wrangler rolled past you with the perfect wheel and tire combo. You grabbed a quick photo; now upload it and our analysis identifies the rim style and approximate tire size, giving you a shopping list to recreate that exact stance on your own Jeep.",
        icon: Eye,
    },
    {
        title: "Verifying Specs Before Purchase",
        desc: "You found a deal on used wheels, but the seller's listing just says '20-inch rims.' Upload the seller's photo and our analysis will break down the full specs (diameter, width, bolt pattern, and offset) so you know if they'll actually fit before you drive across town.",
        icon: ShieldCheck,
    },
]

export default function WheelsRimsClient({ faqItems }: { faqItems: FaqItem[] }) {
    return (
        <VehicleAnalyzer
            title="Vehicle Wheel & Rim Analyzer"
            description="Whether you're hunting for the perfect wheel package or trying to match a setup you saw at a meet, upload your photo. We'll break down the bolt pattern, offset, and rim specs so you can shop with confidence. No more guessing if they'll fit."
            promptContext="wheels, rims, tires, lug nuts, and hubcaps"
            categoryLabel="Wheels & Rims"
            entryPoint="wheels_rims"
            howItWorksSteps={steps}
            howItWorksHeading={<>How the <span className="italic text-primary">Wheel Analyzer</span> Works</>}
            useCaseCards={useCaseCards}
            useCaseHeading="Why People Use the Wheel Analyzer"
            useCaseSubtitle="Whether you're upgrading, matching a build, or double-checking fitment, we do the spec work for you."
            educationalContent={<WheelFitmentGuide />}
            ctaModule={<SaveToGarageCTA placement="category" categoryName="wheels" />}
            faqContent={<FaqAccordion items={faqItems} />}
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
