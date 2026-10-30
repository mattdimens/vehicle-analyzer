import { GarageDashboard } from "@/components/garage/garage-dashboard"
import { pageBackgroundClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

export const metadata = {
    title: "My Garage | Visual Fitment",
    description: "Manage your saved vehicles and parts.",
    robots: { index: false, follow: false },
}

export default function MyGaragePage() {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className={cn(pageBackgroundClass, "pb-24 pt-12 md:pb-32 md:pt-16")}>
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold tracking-tight text-[#17212B] md:text-5xl lg:text-5xl font-heading mb-4">
                        My Garage
                    </h1>
                    <p className="text-sm md:text-lg text-[#5A6672] max-w-2xl font-body leading-relaxed">
                        Manage your saved vehicles and parts.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-16 md:-mt-20 relative z-10 pb-20">
                <GarageDashboard />
            </div>
        </div>
    )
}
