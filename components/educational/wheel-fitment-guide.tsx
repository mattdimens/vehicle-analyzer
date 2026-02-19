import Link from "next/link"

export function WheelFitmentGuide() {
    return (
        <section className="w-full bg-gray-50 py-20">
            <div className="container max-w-3xl">
                <h2 className="font-heading text-3xl font-bold text-black mb-10 text-center">
                    Understanding Wheel Fitment
                </h2>

                <div className="space-y-8">
                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            What Is Bolt Pattern?
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Bolt pattern describes the number of lug holes and the diameter of the circle they form — written as something like 5×114.3 or 6×139.7. The first number is the count of lugs, and the second is the circle diameter in millimeters. If your bolt pattern doesn't match the wheel, it physically won't bolt on, making this the single most important fitment spec. If your truck also needs accessories like a{" "}
                            <Link href="/truck-bed-covers" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">tonneau cover matched to your bed length</Link>{" "}
                            or{" "}
                            <Link href="/nerf-bars-running-boards" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">running boards sized to your cab configuration</Link>, those have their own fitment specs worth checking.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            What Is Wheel Offset?
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Offset measures how far the wheel's mounting surface sits from the centerline, expressed in millimeters. Positive offset tucks the wheel inward (common on front-wheel-drive cars), while negative offset pushes it outward for a wider, more aggressive stance. Getting offset wrong can cause tire rub, poor handling, or accelerated bearing wear.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            Rim Size vs. Tire Size
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Rim diameter (e.g., 17 inches) determines which tires can be mounted, while rim width (e.g., 8 inches) dictates the range of tire widths that fit safely. A 265/70R17 tire needs a 17-inch rim and works best on a 7.5–9 inch wide wheel. Upsizing your diameter usually means going to a lower-profile tire to keep the overall rolling diameter close to stock.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            Hub-Centric vs. Lug-Centric
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Hub-centric wheels have a center bore machined to sit snugly over your vehicle's hub, centering the wheel precisely. Lug-centric wheels rely solely on the lug nuts for centering and may vibrate at highway speeds without hub-centric rings. Most OEM wheels are hub-centric; aftermarket wheels often need adapter rings to match your hub diameter.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            How Visual Fitment Helps
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Instead of crawling under your vehicle with a tape measure,{" "}
                            <Link href="/#upload-zone" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">upload a photo to identify your vehicle's wheel bolt pattern, offset, and rim size instantly</Link>. You get confirmed specs in seconds — plus links to compatible wheels and tires. Have a loose part you can't identify? The{" "}
                            <Link href="/part-identifier" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">Visual Part Identifier</Link>{" "}
                            can name it from a photo.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
