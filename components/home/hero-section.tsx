import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
    return (
        <section
            id="hero"
            className="flex w-full flex-col items-center justify-center px-4 pt-24 pb-12 text-center"
        >
            <div className="max-w-4xl w-full flex flex-col items-center">
                <h1 className="font-heading text-3xl md:text-5xl font-bold">
                    Find vehicle fitment & accessories from an image
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Upload an image of any vehicle to instantly identify vehicle fitment and find compatible accessories to inspire your next purchase.
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
