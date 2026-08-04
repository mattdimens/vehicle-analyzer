"use client"

import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"
import type { HowItWorksStep } from "@/components/home/how-it-works"
import type { UseCaseCard } from "@/components/home/use-cases"
import { BedCoverGuide } from "@/components/educational/bed-cover-guide"
import { FaqAccordion, type FaqItem } from "@/components/ui/faq-accordion"
import { RelatedPages } from "@/components/ui/related-pages"
import { SaveToGarageCTA } from "@/components/ui/save-to-garage-cta"
import { Truck, RotateCcw, ShoppingCart } from "lucide-react"

const steps: HowItWorksStep[] = [
    {
        title: "Photograph Your Truck Bed",
        description:
            "Capture a photo showing your truck's bed, ideally from a rear or side angle so we can gauge bed length, tailgate style, and cab configuration. Works with any pickup truck brand.",
    },
    {
        title: "Bed & Cab Style Measured",
        description:
            "Your truck's exact bed length (short, standard, or long bed), cab type (regular, extended, crew), and any existing accessories are identified to determine precise fitment requirements.",
    },
    {
        title: "Find Your Perfect Cover",
        description:
            "Receive a curated list of compatible tonneau covers (hard folding, soft roll-up, retractable, and more) matched to your truck's measurements, with links to purchase on Amazon.",
    },
]

const useCaseCards: UseCaseCard[] = [
    {
        title: "First-Time Truck Owner",
        desc: "You just picked up a Ram 1500 and want a tonneau cover but have no idea if you have a 5'7\" or 6'4\" bed. Upload a photo from the side and we figure out your exact bed length and cab configuration, then show you covers guaranteed to fit. No tape measure required.",
        icon: Truck,
    },
    {
        title: "Replacing a Worn-Out Cover",
        desc: "Your OEM soft cover is faded and the Velcro is shot after five Michigan winters. Upload a photo so we can identify your current cover type and truck specs, then recommend upgraded alternatives. Maybe it's time to move from a soft roll-up to a hard tri-fold.",
        icon: RotateCcw,
    },
    {
        title: "Comparing Options Before Buying",
        desc: "You've been eyeing a retractable cover but aren't sure it'll work with your toolbox setup. Upload a photo of your bed as-is, and our analysis flags compatibility considerations, like whether your bed rail system supports a low-profile retractable or if you need a different mounting style.",
        icon: ShoppingCart,
    },
]

export default function TruckBedCoversClient({ faqItems }: { faqItems: FaqItem[] }) {
    return (
        <VehicleAnalyzer
            title="Truck Bed Cover Analyzer"
            description="Short bed or long bed? Crew cab or extended? Upload a photo and we'll identify your exact bed length and cab configuration, then match you with tonneau covers and bed liners built for your truck."
            promptContext="truck bed covers, tonneau covers (hard, soft, roll-up, folding), bed liners, and bed caps"
            categoryLabel="Truck Bed Covers"
            entryPoint="truck_bed_covers"
            detectedProductsTitle="Detected Tonneau Cover"
            howItWorksSteps={steps}
            howItWorksHeading={<>How the <span className="italic text-primary">Bed Cover Analyzer</span> Works</>}
            useCaseCards={useCaseCards}
            useCaseHeading="Why People Use the Bed Cover Analyzer"
            useCaseSubtitle="From first-time buyers to seasoned truck owners upgrading their setup, get the right cover without the guesswork."
            educationalContent={<BedCoverGuide />}
            ctaModule={<SaveToGarageCTA placement="category" categoryName="truck bed covers" />}
            faqContent={<FaqAccordion items={faqItems} />}
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Categories", href: "/#categories" },
                { label: "Truck Bed Covers" },
            ]}
            relatedContent={
                <RelatedPages
                    items={[
                        {
                            title: "Wheels & Rims Analysis",
                            description: "Identify bolt pattern, offset, and fitment data for wheels.",
                            href: "/wheels-rims"
                        },
                        {
                            title: "Running Boards",
                            description: "Find side steps that fit your cab size and mounting points.",
                            href: "/nerf-bars-running-boards"
                        },
                        {
                            title: "Full Vehicle Analysis",
                            description: "Analyze your vehicle's year, make, model, and compatible fitment data.",
                            href: "/"
                        }
                    ]}
                />
            }
        />
    )
}
