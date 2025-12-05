import { Badge } from "@/components/ui/badge"

export function HeroSection() {
    return (
        <section
            id="hero"
            className="flex w-full flex-col items-center justify-center px-4 pt-24 pb-12 text-center"
        >
            <div className="max-w-4xl w-full">
                <h1 className="font-heading text-3xl md:text-5xl font-bold">
                    Find vehicle fitment & accessories from an image
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Upload an image of any vehicle to instantly identify vehicle fitment and find compatible accessories to inspire your next purchase.
                </p>
            </div>
        </section>
    )
}
