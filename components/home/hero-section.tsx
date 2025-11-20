import { Badge } from "@/components/ui/badge"

export function HeroSection() {
    return (
        <section
            id="hero"
            className="flex w-full flex-col items-center justify-center px-4 pt-24 pb-12 text-center"
        >
            <div className="max-w-4xl w-full">
                <h1 className="font-heading text-5xl font-bold md:text-7xl">
                    See the Parts. Find the Products.
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Upload an image of any vehicle and our AI will instantly identify
                    fitment and compatible accessories.
                </p>
            </div>
        </section>
    )
}
