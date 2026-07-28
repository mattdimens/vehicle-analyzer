import { AlertCircle, Info } from "lucide-react"

export function ResultsShellHeader() {
    return (
        <div className="space-y-4 mb-6">
            {/* AI Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed">
                    <span className="font-semibold">Disclaimer:</span> These results are generated using AI image recognition technology and may vary in accuracy. We recommend verifying all vehicle details and product compatibility before making a purchase.
                </p>
            </div>

            {/* Affiliate Disclosure */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <Info className="h-3 w-3 flex-shrink-0" />
                <p>
                    We earn a small commission from Amazon purchases made through our links, at no extra cost to you. This helps keep Visual Fitment free.{" "}
                    <a href="/privacy#affiliate-disclosure" className="underline underline-offset-2 hover:text-foreground transition-colors">
                        Learn more
                    </a>
                </p>
            </div>
        </div>
    )
}
