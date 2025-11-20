import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"

export function HowItWorks() {
    return (
        <section id="how-it-works" className="w-full bg-muted/50 py-24">
            <div className="container max-w-6xl">
                <div className="mb-12 text-center">
                    <h2 className="font-heading text-4xl font-bold">How It Works</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Get from image to analysis in three simple steps.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Step 1 */}
                    <Card>
                        <CardHeader className="text-left">
                            <CardDescription className="font-medium text-primary">
                                Step 1
                            </CardDescription>
                            <CardTitle>Upload Vehicle Image</CardTitle>
                            <CardDescription>
                                Drag any vehicle image into the dropzone, or click to select one
                                from your device.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    {/* Step 2 */}
                    <Card>
                        <CardHeader className="text-left">
                            <CardDescription className="font-medium text-primary">
                                Step 2
                            </CardDescription>
                            <CardTitle>Choose Analysis</CardTitle>
                            <CardDescription>
                                Select what you want to find: "Analyze Fitment", "Detect
                                Products", or "Fitment & Products".
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    {/* Step 3 */}
                    <Card>
                        <CardHeader className="text-left">
                            <CardDescription className="font-medium text-primary">
                                Step 3
                            </CardDescription>
                            <CardTitle>Get Instant Insights</CardTitle>
                            <CardDescription>
                                Click "Start" to get a detailed, AI-powered breakdown of your
                                vehicle and its parts.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </section>
    )
}
