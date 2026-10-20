import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Policy | Visual Fitment",
    description: "How Visual Fitment handles your images, data, and privacy.",
}

// TODO: set a monitored address for privacy and deletion requests. While empty,
// the contact section points to in-app deletion instead of showing an email.
const CONTACT_EMAIL = ""

const linkClass = "text-primary underline underline-offset-2 hover:text-primary/80"

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <div className="flex-1 bg-white">
                <div className="container max-w-3xl mx-auto px-4 py-16 md:py-24">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
                    <p className="text-sm text-muted-foreground mb-12">Last updated: October 20, 2026</p>

                    <div className="space-y-10 text-[15px] leading-relaxed text-foreground/80">

                        {/* 1. Image Data */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">What happens to your images</h2>
                            <p className="mb-3">
                                When you upload a photo, here&apos;s exactly what happens:
                            </p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Your browser resizes the photo before uploading it. This also removes embedded camera metadata, such as GPS location, from JPEG photos.</li>
                                <li>The photo is stored in our cloud storage (Supabase) at a randomly generated, unlisted web address. Anyone who has that exact address can view the image, but the addresses are not published or indexed.</li>
                                <li>We send the photo to Google&apos;s Gemini API to identify the vehicle, parts, and accessories. Under Google&apos;s paid API terms, your images are not used to train Google&apos;s models; Google may retain them for a limited time for abuse monitoring.</li>
                                <li>The analysis results (vehicle details, detected products, part identification) are saved to our database. Results from the homepage photo tool get their own results page, which anyone with the link can view. Results pages are not indexed by search engines.</li>
                            </ol>
                            <p className="mt-3">
                                <strong>We do not sell your images or personal information, and we do not use your images for advertising.</strong>
                            </p>
                        </section>

                        {/* 2. Your Account */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">Your account</h2>
                            <p>
                                If you sign in with Google to use My Garage, we receive your name, email address, and profile picture from Google for authentication. We never see or store your Google password. Vehicles and parts you save to My Garage are linked to your account so you can access them across sessions, and you can delete them at any time from My Garage.
                            </p>
                        </section>

                        {/* 3. Analytics & Cookies */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">Analytics, cookies &amp; browser storage</h2>
                            <p className="mb-3">
                                We use <strong>Google Analytics 4</strong> to understand how the site is used: which pages are visited, the type of device and browser, approximate location (city or region), and actions such as starting a photo analysis, saving to My Garage, or clicking a product link. Google Analytics sets the <code>_ga</code> and <code>_ga_*</code> cookies. Google may use this data as described in{" "}
                                <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className={linkClass}>How Google uses information from sites that use its services</a>. You can opt out with the{" "}
                                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className={linkClass}>Google Analytics opt-out browser add-on</a>.
                            </p>
                            <p className="mb-3">
                                When you click a product link or use the vehicle selector, we set our own <code>vf_sid</code> cookie: a random identifier that lasts one year and lets us group product-link clicks and vehicle searches from the same browser in our own reports. It contains no personal information and is not shared with anyone.
                            </p>
                            <p>
                                We also use your browser&apos;s local storage to keep you signed in, to remember a vehicle or part you asked to save while signing in, and (for the current visit only) to record which page you arrived on.
                            </p>
                        </section>

                        {/* 4. Affiliate Links */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">Affiliate links disclosure</h2>
                            <p className="mb-3">
                                Product links on this site (e.g., &quot;Find on Amazon&quot; buttons) are <strong>Amazon Associates affiliate links</strong>. As an Amazon Associate we earn from qualifying purchases, at no extra cost to you. This is how we keep the site free. Clicking these links is entirely optional and does not affect your analysis results.
                            </p>
                            <p>
                                Product links pass through our own redirect, which records the search terms, the vehicle, the page the click came from, and your browser type before sending you to Amazon. We use the browser type to filter out automated traffic. Once you are on Amazon, Amazon may set its own cookies to attribute purchases, and{" "}
                                <a href="https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ" target="_blank" rel="noopener noreferrer" className={linkClass}>Amazon&apos;s Privacy Notice</a> applies.
                            </p>
                        </section>

                        {/* 5. Data Retention */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">How long we keep your data</h2>
                            <p>
                                Uploaded images, analysis results, and product-link click records are kept indefinitely to operate and improve the service, unless you ask us to delete them. My Garage items are kept until you delete them or ask us to delete your account. Google Analytics data is kept according to the retention setting of our Analytics property.
                            </p>
                        </section>

                        {/* 6. Contact & Deletion */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">Data deletion &amp; contact</h2>
                            {CONTACT_EMAIL ? (
                                <p>
                                    To ask a question, or to request deletion of your images, analysis results, or account, email us at{" "}
                                    <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{CONTACT_EMAIL}</a>. For an image or results page, include its link so we can find it.
                                </p>
                            ) : (
                                <p>
                                    If you have a My Garage account, you can delete any saved vehicle or part yourself at any time from My Garage. A dedicated contact address for other privacy questions and deletion requests (such as uploaded images or results pages) is coming soon and will be listed here.
                                </p>
                            )}
                        </section>

                    </div>
                </div>
            </div>
        </div>
    )
}
