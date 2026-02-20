"use client"

import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"
import type { HowItWorksStep } from "@/components/home/how-it-works"
import type { UseCaseCard } from "@/components/home/use-cases"
import { RunningBoardGuide } from "@/components/educational/running-board-guide"
import { FaqAccordion, type FaqItem } from "@/components/ui/faq-accordion"
import { RelatedPages } from "@/components/ui/related-pages"
import { Footprints, Mountain, Users } from "lucide-react"

const steps: [HowItWorksStep, HowItWorksStep, HowItWorksStep] = [
    {
        title: "Upload a Side-Profile Shot",
        description:
            "Snap a photo of your truck or SUV from the side. The AI uses this angle to assess cab size, door count, rocker panel height, and overall body style for mounting compatibility.",
    },
    {
        title: "AI Determines Mounting Fit",
        description:
            "Your vehicle's cab configuration (regular, extended, or crew) is detected along with body dimensions. The AI checks these against manufacturer mounting specs to ensure a correct, no-drill fit.",
    },
    {
        title: "Shop Matched Running Boards",
        description:
            "Browse running boards, nerf bars, and side steps confirmed to fit your vehicle. Each recommendation includes style details, weight capacity, and a direct Amazon link for easy ordering.",
    },
]

const useCaseCards: UseCaseCard[] = [
    {
        title: "Making Entry Easier",
        desc: "Your family struggles to climb into your lifted F-250. Upload a side shot and the AI identifies your cab type and rocker panel height, then recommends running boards with the right drop, from low-profile power steps for grandma to heavy-duty nerf bars for everyday use.",
        icon: Footprints,
    },
    {
        title: "Off-Road Protection",
        desc: "You're building out a trail rig and need rock sliders that actually protect the rocker panels, not just look good. Upload a photo of your 4Runner so the AI can match your exact wheelbase and body mount points, then browse heavy-gauge steel sliders rated for real off-road use.",
        icon: Mountain,
    },
    {
        title: "Fleet & Commercial Vehicles",
        desc: "You manage a fleet of work trucks and need to outfit twenty Silverados with the same side steps. Upload a photo of one truck, confirm the AI's fitment match, and order with confidence, knowing every truck in the fleet gets the correct bolt-on kit without individual measurements.",
        icon: Users,
    },
]

const runningBoardFaqs: FaqItem[] = [
    {
        question: "What's the difference between running boards and nerf bars?",
        answer: "Running boards are wide, flat platforms that run the full length of the cab for easy step-in access. Nerf bars are round tubes (usually 3–4 inches in diameter) with small step pads welded on — they look sportier but offer less foot surface area. Choose running boards for family vehicles and nerf bars for a more athletic aesthetic."
    },
    {
        question: "Do I need a specific mounting bracket for my truck?",
        answer: "Yes, brackets are vehicle-specific because each truck has unique rocker panel dimensions and factory mounting points. Most quality running board kits include the correct brackets for your year, make, and model. Universal brackets exist but may require drilling and don't always fit as securely."
    },
    {
        question: "Can I install running boards myself?",
        answer: "Most bolt-on running boards can be installed in 1–2 hours with basic hand tools — no drilling required if you use a vehicle-specific kit. You'll typically need a socket set, a torque wrench, and a friend to help hold the board in position while you tighten the bolts."
    },
    {
        question: "What material is best for running boards?",
        answer: "Aluminum is lightweight and corrosion-resistant, ideal for daily drivers especially in salty climates. Stainless steel is heavier but gives a polished chrome look. Powder-coated steel is the toughest option for off-road use; it hides trail damage and handles heavy loads without bending."
    },
    {
        question: "How does cab size affect running board fitment?",
        answer: "Cab size determines the length of running board you need. A regular cab needs the shortest boards, an extended cab needs mid-length, and a crew cab needs the longest. Installing the wrong length means the board either stops short of the rear door or extends awkwardly past the body."
    },
]

export default function RunningBoardsClient() {
    return (
        <VehicleAnalyzer
            title="Running Board Analyzer"
            description="The right running boards depend on your cab size, door count, and mounting points. Upload a photo and we'll figure out the specs so you get a perfect fit, no measuring tape required."
            promptContext="nerf bars, running boards, side steps, rock sliders, and power steps"
            categoryLabel="Running Boards & Nerf Bars"
            howItWorksSteps={steps}
            howItWorksHeading={<>How the <span className="italic text-primary">Running Board Analyzer</span> Works</>}
            useCaseCards={useCaseCards}
            useCaseHeading="Why People Use the Running Board Analyzer"
            useCaseSubtitle="From daily drivers to trail rigs and work fleets, find the right side step without crawling under the truck with a tape measure."
            educationalContent={<RunningBoardGuide />}
            faqContent={<FaqAccordion items={runningBoardFaqs} />}
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Categories", href: "/#categories" },
                { label: "Running Boards & Nerf Bars" },
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
                            title: "Truck Bed Covers",
                            description: "Get the right tonneau cover by identifying your bed length.",
                            href: "/truck-bed-covers"
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
