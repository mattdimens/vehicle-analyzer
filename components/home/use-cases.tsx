import { ShoppingBag, Camera, Wrench, Sparkles, type LucideIcon } from "lucide-react"

export interface UseCaseCard {
    title: string
    desc: string
    icon: LucideIcon
}

interface UseCasesProps {
    heading?: string
    subtitle?: string
    cards?: UseCaseCard[]
}

const defaultCards: UseCaseCard[] = [
    {
        title: "Accessory Shoppers",
        desc: "You just bought a used 4Runner and want to add a roof rack, but you're not sure of the exact generation or trim. Upload a photo and get the precise year, model, and trim, then browse compatible racks on Amazon without second-guessing fitment.",
        icon: ShoppingBag,
    },
    {
        title: "Enthusiasts",
        desc: "You spot a Ford Raptor at a car show with aggressive fender flares and a killer wheel setup. Snap a photo, run the product detector, and walk away with a list of every visible mod (brand names, styles, and purchase links) so you can replicate the look on your own truck.",
        icon: Camera,
    },
    {
        title: "Detailers & Shops",
        desc: "A customer pulls in for ceramic coating work. Before you touch the car, upload a quick photo to auto-fill make, model, trim, color, and any visible aftermarket parts, creating a complete vehicle record for your shop management system in seconds, not minutes.",
        icon: Wrench,
    },
    {
        title: "Build Inspiration",
        desc: "You've been saving Instagram photos of your dream overlanding setup. Upload those inspiration shots and the AI will identify every part, from the bumper guard to the rooftop tent, and tell you exactly which pieces are compatible with your own vehicle.",
        icon: Sparkles,
    },
]

export function UseCases({ heading, subtitle, cards = defaultCards }: UseCasesProps) {
    return (
        <section id="use-cases" className="w-full py-24 bg-white">
            <div className="container max-w-6xl">
                <div className="rounded-[2.5rem] bg-[#16232A] px-6 py-20 text-center text-white md:px-16 md:py-24">
                    <div className="mx-auto max-w-3xl">
                        <h2 className="mb-6 font-heading text-4xl font-bold md:text-5xl">
                            {heading ?? "Built for any use case"}
                        </h2>
                        <p className="mb-16 text-lg text-white/80">
                            {subtitle ?? "Whether you're shopping for parts, showing off your build, or managing a shop, we've got you covered."}
                        </p>
                    </div>

                    <div className={`grid grid-cols-1 gap-6 ${cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                        {cards.map((item) => (
                            <div
                                key={item.title}
                                className="group relative overflow-hidden rounded-2xl bg-white/5 p-8 text-left transition-all hover:bg-white/10"
                            >
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white group-hover:bg-white/20">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-3 font-heading text-xl font-bold">
                                    {item.title}
                                </h3>
                                <p className="leading-relaxed text-white/70">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
