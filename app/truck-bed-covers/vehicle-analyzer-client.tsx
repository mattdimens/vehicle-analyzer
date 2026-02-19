"use client"

import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"
import type { HowItWorksStep } from "@/components/home/how-it-works"
import type { UseCaseCard } from "@/components/home/use-cases"
import { BedCoverGuide } from "@/components/educational/bed-cover-guide"
import { FaqAccordion, type FaqItem } from "@/components/ui/faq-accordion"
import { RelatedPages } from "@/components/ui/related-pages"
import { Truck, RotateCcw, ShoppingCart } from "lucide-react"

const steps: [HowItWorksStep, HowItWorksStep, HowItWorksStep] = [
    {
        title: "Photograph Your Truck Bed",
        description:
            "Capture a photo showing your truck's bed — ideally from a rear or side angle so the AI can gauge bed length, tailgate style, and cab configuration. Works with any pickup truck brand.",
    },
    {
        title: "AI Measures Bed & Cab Style",
        description:
            "The AI identifies your truck's exact bed length (short, standard, or long bed), cab type (regular, extended, crew), and any existing accessories to determine precise fitment requirements.",
    },
    {
        title: "Find Your Perfect Cover",
        description:
            "Receive a curated list of compatible tonneau covers — hard folding, soft roll-up, retractable, and more — matched to your truck's measurements, with links to purchase on Amazon.",
    },
]

const useCaseCards: UseCaseCard[] = [
    {
        title: "First-Time Truck Owner",
        desc: "You just picked up a Ram 1500 and want a tonneau cover but have no idea if you have a 5'7\" or 6'4\" bed. Upload a photo from the side and the AI figures out your exact bed length and cab configuration — then shows you covers guaranteed to fit, no tape measure required.",
        icon: Truck,
    },
    {
        title: "Replacing a Worn-Out Cover",
        desc: "Your OEM soft cover is faded and the Velcro is shot after five Michigan winters. Upload a photo so the AI identifies your current cover type and truck specs, then recommends upgraded alternatives — maybe it's time to move from a soft roll-up to a hard tri-fold.",
        icon: RotateCcw,
    },
    {
        title: "Comparing Options Before Buying",
        desc: "You've been eyeing a retractable cover but aren't sure it'll work with your toolbox setup. Upload a photo of your bed as-is, and the AI flags compatibility considerations — like whether your bed rail system supports a low-profile retractable or if you need a different mounting style.",
        icon: ShoppingCart,
    },
]

const bedCoverFaqs: FaqItem[] = [
    {
        question: "How do I measure my truck bed length?",
        answer: "Measure from the inside of the bulkhead (the wall behind the cab) to the inside of the tailgate, at the floor, with the tailgate closed. Common lengths are 5'7\" (short), 6'4\"–6'6\" (standard), and 8' (long). Or skip the tape measure and upload a photo — the AI figures it out from the image."
    },
    {
        question: "What's the difference between a tonneau cover and a bed cap?",
        answer: "A tonneau cover sits at bed-rail height and covers the bed opening — it's flat, low-profile, and available in soft or hard versions. A bed cap (or camper shell) is a raised enclosure that adds height and fully encloses the bed like a trunk. Tonneau covers are better for aerodynamics; caps are better for hauling tall cargo or camping."
    },
    {
        question: "Do bed covers improve gas mileage?",
        answer: "Yes, modestly. Studies show tonneau covers can improve fuel economy by 1–3% by reducing aerodynamic drag in the bed. Hard flush-mount covers tend to perform better than soft roll-ups, but the savings vary by driving speed and conditions."
    },
    {
        question: "Can I use a bed cover with a bed liner?",
        answer: "Absolutely — most tonneau covers are designed to work alongside both spray-in and drop-in bed liners. The key is to make sure the liner doesn't raise the bed rail height enough to interfere with the cover's clamps or seals. Drop-in liners with raised edges sometimes need trimming around the mounting points."
    },
    {
        question: "How does the AI identify my truck bed size?",
        answer: "The AI analyzes your photo to determine the cab style (crew, extended, regular), which narrows down the possible bed lengths for that model. It cross-references visible proportions and known manufacturer configurations to confirm the exact bed size — giving you a match in seconds."
    },
]

export default function TruckBedCoversClient() {
    return (
        <VehicleAnalyzer
            title="Truck Bed Cover Analyzer"
            description="Short bed or long bed? Crew cab or extended? Upload a photo and we'll identify your exact bed length and cab configuration, then match you with tonneau covers and bed liners built for your truck."
            promptContext="truck bed covers, tonneau covers (hard, soft, roll-up, folding), bed liners, and bed caps"
            categoryLabel="Truck Bed Covers"
            detectedProductsTitle="Detected Tonneau Cover"
            howItWorksSteps={steps}
            howItWorksHeading={<>How the <span className="italic text-primary">Bed Cover Analyzer</span> Works</>}
            useCaseCards={useCaseCards}
            useCaseHeading="Why People Use the Bed Cover Analyzer"
            useCaseSubtitle="From first-time buyers to seasoned truck owners upgrading their setup — get the right cover without the guesswork."
            educationalContent={<BedCoverGuide />}
            faqContent={<FaqAccordion items={bedCoverFaqs} />}
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
