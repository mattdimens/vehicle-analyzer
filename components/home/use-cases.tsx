import { ShoppingBag, Camera, Wrench, Sparkles } from "lucide-react"

export function UseCases() {
    return (
        <section id="use-cases" className="w-full py-24">
            <div className="container max-w-6xl">
                <div className="rounded-[2.5rem] bg-[#2A172D] px-6 py-20 text-center text-white md:px-16 md:py-24">
                    <div className="mx-auto max-w-3xl">
                        <h2 className="mb-6 font-heading text-4xl font-bold md:text-5xl">
                            Built for any use case
                        </h2>
                        <p className="mb-16 text-lg text-white/80">
                            Whether you're shopping for parts, showing off your build, or managing a shop, we've got you covered.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {[
                            {
                                title: "Accessory Shoppers",
                                desc: "Shopping for accessories? Upload a picture of your ride to instantly identify its exact fitment, ensuring you buy the right parts, hassle-free.",
                                icon: ShoppingBag,
                            },
                            {
                                title: "Enthusiasts",
                                desc: "See a setup you love at a car show or online? Snap a photo, run the product detector, and get a list of the visible mods, from wheels to roof racks.",
                                icon: Camera,
                            },
                            {
                                title: "Detailers & Shops",
                                desc: "Log customer vehicles as they arrive. Get an instant, AI-generated record of the vehicle's make, model, trim, and color for your files.",
                                icon: Wrench,
                            },
                            {
                                title: "Inspiration",
                                desc: "Building your dream ride? Upload inspiration photos to identify parts and find out what's compatible with your own vehicle to replicate the look.",
                                icon: Sparkles,
                            },
                        ].map((item) => (
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
