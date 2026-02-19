import Link from "next/link"

export function BedCoverGuide() {
    return (
        <section className="w-full bg-gray-50 py-20">
            <div className="container max-w-3xl">
                <h2 className="font-heading text-3xl font-bold text-black mb-10 text-center">
                    Understanding Truck Bed Covers
                </h2>

                <div className="space-y-8">
                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            Bed Lengths: 5'7" vs. 6'4" vs. 8'
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Truck beds come in three standard lengths: short bed (roughly 5'7"), standard bed (6'4"–6'6"), and long bed (8'). Every tonneau cover is manufactured to a specific bed length, so a cover built for a 6'4" bed won't seal properly on a 5'7" bed. Knowing your exact measurement is the difference between a perfect fit and a gap that lets water in.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            Cab Styles and Why They Matter
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            The cab style — regular, extended (or King Cab / Double Cab), or crew cab — determines which bed lengths are available for your truck. A crew cab F-150 comes with a 5'7" or 6'5" bed, while a regular cab gets the full 8'. Cab style also affects{" "}
                            <Link href="/nerf-bars-running-boards" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">which running boards and nerf bars fit your truck</Link>, since board length varies by door count.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            Tri-Fold vs. Roll-Up vs. Retractable
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Tri-fold covers fold in three sections toward the cab, giving you partial bed access without removing anything. Roll-up covers retract into a compact cylinder at the cab end, offering full bed access quickly. Retractable covers slide into a canister behind the cab for a flush, low-profile look — they're the most expensive but the most weather-tight.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            Hard Covers vs. Soft Covers
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Soft covers use vinyl or canvas stretched over aluminum frames — they're affordable, lightweight, and easy to install. Hard covers are made from fiberglass, aluminum, or ABS plastic, offering better security and weather protection at a higher price point. Your choice depends on whether you prioritize budget and convenience or durability and theft deterrence.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            How Visual Fitment Helps
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            <Link href="/#upload-zone" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">Upload a photo to identify your truck's bed length and cab configuration instantly</Link>{" "}
                            — no tape measure or VIN lookup needed. The AI matches you with compatible tonneau covers sized to your exact bed dimensions. While you're at it, check whether your{" "}
                            <Link href="/wheels-rims" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">wheels and rims match the correct bolt pattern for your truck</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
