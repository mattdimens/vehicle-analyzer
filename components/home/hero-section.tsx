import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface HeroSectionProps {
    title?: string
    description?: string
}

export function HeroSection({
    title = "Find vehicle fitment, parts, & accessories from an image",
    description = "See a truck with the perfect setup? Snap a photo and we'll tell you exactly what's on it: make, model, trim, and every visible mod, plus links to buy the right parts for your ride."
}: HeroSectionProps) {
    return (
        <section
            id="hero"
            className="flex w-full flex-col items-center justify-center px-4 pt-24 pb-12 text-center"
        >
            <div className="max-w-4xl w-full flex flex-col items-center">
                <h1 className="font-heading text-3xl md:text-5xl font-bold text-white">
                    {title}
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-white/80">
                    {description}
                </p>

                <div className="mt-8">
                    <Button asChild size="lg" className="text-lg px-8 h-12">
                        <Link href="#upload-zone">
                            Try it now <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}
