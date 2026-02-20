"use client"

import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"
import type { HowItWorksStep } from "@/components/home/how-it-works"
import type { UseCaseCard } from "@/components/home/use-cases"
import { RelatedPages } from "@/components/ui/related-pages"
import { Wrench, Warehouse, Package } from "lucide-react"

const steps: [HowItWorksStep, HowItWorksStep, HowItWorksStep] = [
    {
        title: "Upload Part Photo",
        description:
            "Take a clear photo of the car part you want to identify. It can be loose on a workbench, still installed on the vehicle, or even in its original packaging; our AI handles all scenarios.",
    },
    {
        title: "AI Identifies the Part",
        description:
            "Our vision model recognizes the component and classifies it by category, returning its name, function, and which vehicles it's commonly found on, all with a confidence score so you know how certain the match is.",
    },
    {
        title: "Get Part Details & Shopping Links",
        description:
            "View the full identification: part name, what it does, which vehicles it fits, and the AI's reasoning. Then click straight through to Amazon to find the exact replacement or upgrade.",
    },
]

const useCaseCards: UseCaseCard[] = [
    {
        title: "DIY Mechanics",
        desc: "You're elbow-deep in a brake job and pull out a worn component you can't quite name. Is it a caliper bracket, a dust shield, or a backing plate? Snap a photo on your phone, and the AI tells you exactly what it is and where to order a replacement, so you're not stuck waiting on a parts store employee to identify it.",
        icon: Wrench,
    },
    {
        title: "Junkyard Finds",
        desc: "You're walking the rows at a pull-a-part yard and spot a part that looks like it could work for your project car. Before you unbolt it and pay, photograph it and let the AI confirm what it is, which vehicles it came from, and whether it's actually compatible with yours, saving you time and a few bucks on a part that won't fit.",
        icon: Warehouse,
    },
    {
        title: "Online Shoppers",
        desc: "A Facebook Marketplace listing says 'OEM intake manifold, fits most V8s,' but does it fit YOUR V8? Upload the seller's photo and the AI identifies the exact part number, application, and vehicle compatibility, so you know whether it's a match before you commit to buying.",
        icon: Package,
    },
]

export default function PartIdentifierClient() {
    return (
        <VehicleAnalyzer
            title="Visual Part Identifier"
            description="Upload a photo of any car part and let AI instantly identify it: name, function, vehicle compatibility, and where to buy it."
            analysisMode="part"
            howItWorksSteps={steps}
            howItWorksHeading={<>How the <span className="italic text-primary">Part Identifier</span> Works</>}
            useCaseCards={useCaseCards}
            useCaseHeading="Who Uses the Part Identifier"
            useCaseSubtitle="Mechanics, junkyard diggers, and online shoppers: anyone who's ever held a car part and thought 'what is this thing?'"
            relatedContent={
                <RelatedPages
                    items={[
                        {
                            title: "Full Vehicle Analysis",
                            description: "Analyze your vehicle's year, make, model, and compatible fitment data.",
                            href: "/"
                        },
                        {
                            title: "Wheels & Rims",
                            description: "Find the perfect wheel fitment including bolt pattern and offset data.",
                            href: "/wheels-rims"
                        },
                        {
                            title: "Truck Bed Covers",
                            description: "Identify bed length and find the right tonneau cover for your truck.",
                            href: "/truck-bed-covers"
                        }
                    ]}
                />
            }
        />
    )
}
