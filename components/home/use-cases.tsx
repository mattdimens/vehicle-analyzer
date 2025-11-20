import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"

export function UseCases() {
    return (
        <section id="use-cases" className="w-full py-24">
            <div className="container max-w-6xl">
                <div className="mb-12 text-center">
                    <h2 className="font-heading text-4xl font-bold">Use Cases</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Perfect for enthusiasts, shoppers, and professionals.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {[
                        {
                            title: "Accessory Shoppers",
                            desc: "Shopping for accessories? Upload a picture of your ride to instantly identify its exact fitment, ensuring you buy the right parts, hassle-free.",
                        },
                        {
                            title: "Enthusiasts",
                            desc: "See a setup you love at a car show or online? Snap a photo, run the product detector, and get a list of the visible mods, from wheels to roof racks.",
                        },
                        {
                            title: "Detailers & Shops",
                            desc: "Log customer vehicles as they arrive. Get an instant, AI-generated record of the vehicle's make, model, trim, and color for your files.",
                        },
                        {
                            title: "Inspiration",
                            desc: "Building your dream ride? Upload inspiration photos to identify parts and find out what's compatible with your own vehicle to replicate the look.",
                        },
                    ].map((item) => (
                        <Card
                            key={item.title}
                            className="transition-all hover:scale-[1.03] hover:shadow-lg text-left"
                        >
                            <CardHeader>
                                <CardTitle>{item.title}</CardTitle>
                                <CardDescription>{item.desc}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
