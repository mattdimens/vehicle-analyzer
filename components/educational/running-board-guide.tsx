import Link from "next/link"

export function RunningBoardGuide() {
    return (
        <section className="w-full bg-gray-50 py-20">
            <div className="container max-w-3xl">
                <h2 className="font-heading text-3xl font-bold text-black mb-10 text-center">
                    Understanding Running Boards & Side Steps
                </h2>

                <div className="space-y-8">
                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            Cab Configurations and Fit
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Running boards are sized to match your cab — regular cab boards are the shortest, extended cab boards cover the front and rear-hinged doors, and crew cab boards span the full length of four full-size doors. Installing the wrong cab length means either a board that stops short of the rear door or one that extends past the body and looks awkward.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            Mounting Types
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Most running boards bolt to factory mounting points using vehicle-specific brackets — no drilling required. Others use universal clamp-on brackets that grip the rocker panel, offering flexibility across different makes but sometimes a less secure fit. High-end options like power steps use electric motors and mount to the frame with dedicated hardware.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            Nerf Bars vs. Side Steps vs. Rock Sliders
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Nerf bars are round tubes (usually 3"–4" diameter) that run the length of the cab with step pads welded on — great for a sporty look and light duty use. Side steps are wider, flat platforms that offer more foot surface area and are better for passengers in dress shoes or kids climbing in. Rock sliders are heavy-gauge steel rails designed to protect rocker panels off-road — they double as steps but are built for impact, not comfort.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            Material Differences
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            Aluminum running boards are lightweight and resist corrosion, making them ideal for daily drivers in salty climates. Stainless steel offers a polished, chrome-like finish with excellent durability but adds weight. Textured black powder-coated steel is the go-to for off-road builds — pair them with{" "}
                            <Link href="/wheels-rims" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">aftermarket wheels sized to the correct bolt pattern and offset</Link>{" "}
                            for a complete trail-ready look.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-heading text-xl font-semibold text-black mb-2">
                            How Visual Fitment Helps
                        </h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                            <Link href="/#upload-zone" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">Upload a side-profile photo to identify your cab type and running board fitment instantly</Link>{" "}
                            — the AI detects your door count and rocker panel height, the three specs that determine compatibility. You'll get matched recommendations you can buy with confidence. Also outfitting your bed? Check which{" "}
                            <Link href="/truck-bed-covers" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">tonneau covers and bed liners fit your truck's bed length</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
