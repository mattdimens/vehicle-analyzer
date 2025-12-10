import { Upload, Zap, Table } from "lucide-react"

export function HowItWorks() {
    return (
        <section id="how-it-works" className="w-full bg-white py-24">
            <div className="container max-w-6xl">
                <div className="mb-20 text-center">
                    <h2 className="font-heading text-5xl font-bold text-black">
                        How <span className="italic text-primary">Visual Fitment</span> Works
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                    {/* Step 1 */}
                    <div className="flex flex-col">
                        <div className="relative mb-8 flex h-40 items-center justify-center">
                            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-white">
                                <Upload className="h-8 w-8" />
                            </div>
                            {/* Connector Line (Right) */}
                            <div className="absolute right-0 top-1/2 hidden h-[2px] w-1/2 -translate-y-1/2 border-t-2 border-dashed border-black md:block" />
                        </div>
                        <div className="border-t border-black pt-6">
                            <h3 className="mb-3 font-heading text-2xl font-medium">
                                Upload Vehicle Image
                            </h3>
                            <p className="text-lg leading-relaxed text-muted-foreground">
                                Easily upload the vehicle image you'd like to analyze. Drag and drop or select from your device.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col">
                        <div className="relative mb-8 flex h-40 items-center justify-center">
                            {/* Connector Line (Left) */}
                            <div className="absolute left-0 top-1/2 hidden h-[2px] w-1/2 -translate-y-1/2 border-t-2 border-dashed border-black md:block" />

                            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-[#0F172A] text-white">
                                <Zap className="h-8 w-8" />
                            </div>

                            {/* Connector Line (Right) */}
                            <div className="absolute right-0 top-1/2 hidden h-[2px] w-1/2 -translate-y-1/2 border-t-2 border-dashed border-black md:block" />
                        </div>
                        <div className="border-t border-black pt-6">
                            <h3 className="mb-3 font-heading text-2xl font-medium">
                                Choose Analysis
                            </h3>
                            <div className="text-lg leading-relaxed text-muted-foreground">
                                <p className="mb-3">Choose from three separate analyses:</p>
                                <ul className="space-y-2 text-base">
                                    <li><strong>Analyze Fitment</strong> - Identifies your vehicle's make, model, trim, year, etc.</li>
                                    <li><strong>Detect Products</strong> - Identifies aftermarket parts and accessories</li>
                                    <li><strong>Fitment & Products</strong> - Get a complete analysis with all of the above</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col">
                        <div className="relative mb-8 flex h-40 items-center justify-center">
                            {/* Connector Line (Left) */}
                            <div className="absolute left-0 top-1/2 hidden h-[2px] w-1/2 -translate-y-1/2 border-t-2 border-dashed border-black md:block" />

                            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-white">
                                <Table className="h-8 w-8" />
                            </div>
                        </div>
                        <div className="border-t border-black pt-6">
                            <h3 className="mb-3 font-heading text-2xl font-medium">
                                Get Instant Results
                            </h3>
                            <p className="text-lg leading-relaxed text-muted-foreground">
                                Analysis results are organized into a comprehensive table detailing your vehicle's fitment specifications, detected parts, and compatibility data in seconds.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
