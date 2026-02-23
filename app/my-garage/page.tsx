import { GarageDashboard } from "@/components/garage/garage-dashboard"

export const metadata = {
    title: "My Garage | Visual Fitment",
    description: "Manage your saved vehicles and parts.",
}

export default function MyGaragePage() {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="bg-[#003223] pb-24 pt-12 md:pb-32 md:pt-16">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-5xl font-heading mb-4">
                        My Garage
                    </h1>
                    <p className="text-sm md:text-lg text-white/80 max-w-2xl font-body leading-relaxed">
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
