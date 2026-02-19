import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Policy | Visual Fitment",
    description: "How Visual Fitment handles your images, data, and privacy.",
}

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1 bg-white">
                <div className="container max-w-3xl mx-auto px-4 py-16 md:py-24">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
                    <p className="text-sm text-muted-foreground mb-12">Last updated: February 19, 2026</p>

                    <div className="space-y-10 text-[15px] leading-relaxed text-foreground/80">

                        {/* 1. Image Data */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">What happens to your images</h2>
                            <p className="mb-3">
                                When you upload a photo, here&apos;s exactly what happens:
                            </p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Your image is uploaded to our cloud storage (Supabase) so we can pass it to the AI.</li>
                                <li>The image URL is sent to <strong>Google&apos;s Gemini API</strong> for analysis. Google processes the image to generate results but <strong>does not use your images to train their models</strong> when accessed via their paid API.</li>
                                <li>The AI&apos;s analysis results (vehicle details, part identification, etc.) are saved to our database.</li>
                            </ol>
                            <p className="mt-3">
                                <strong>We do not sell, share, or use your images for advertising.</strong> Images are stored indefinitely in our cloud storage unless you request deletion (see below).
                            </p>
                        </section>

                        {/* 2. Analytics & Cookies */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">Analytics &amp; cookies</h2>
                            <p>
                                We use basic, anonymous analytics to understand which features people use (e.g., how many analyses are run, which pages are visited). We <strong>do not</strong> use advertising cookies or track you across other websites. The only cookies we set are essential ones required for the site to function.
                            </p>
                        </section>

                        {/* 3. Affiliate Links */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">Affiliate links disclosure</h2>
                            <p>
                                Product links on this site (e.g., &quot;Find on Amazon&quot; buttons) are <strong>Amazon Associates affiliate links</strong>. This means we earn a small commission if you purchase something after clicking — at no extra cost to you. This is how we keep the site free. Clicking these links is entirely optional and does not affect your analysis results.
                            </p>
                        </section>

                        {/* 4. Third-Party Services */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">Third-party services we use</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Google Gemini API</strong> — processes your images for vehicle/part identification. Subject to <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google&apos;s API terms</a>.</li>
                                <li><strong>Supabase</strong> — securely stores uploaded images and analysis results.</li>
                                <li><strong>Amazon Associates</strong> — powers affiliate product links. Subject to <a href="https://www.amazon.com/gp/help/customer/display.html?nodeId=468496" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Amazon&apos;s privacy policy</a>.</li>
                                <li><strong>Vercel</strong> — hosts the website and provides anonymous web analytics.</li>
                            </ul>
                        </section>

                        {/* 5. Data Retention */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">How long we keep your data</h2>
                            <p>
                                Analysis results are stored indefinitely to help us improve the service. Uploaded images remain in cloud storage unless you request deletion. We do not have user accounts, so we don&apos;t store passwords, emails, or personal profiles.
                            </p>
                        </section>

                        {/* 6. Contact & Deletion */}
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-3">Data deletion &amp; contact</h2>
                            <p>
                                Want your images or data removed? Email us at{" "}
                                <a href="mailto:privacy@visualfitment.com" className="text-primary hover:underline">
                                    privacy@visualfitment.com
                                </a>{" "}
                                and we&apos;ll delete it within 30 days. Include any details that help us find your data (e.g., approximate upload date, what the image was of).
                            </p>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    )
}
