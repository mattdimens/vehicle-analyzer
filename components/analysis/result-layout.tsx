"use client"

import { useState } from "react"
import { Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VehicleSelector } from "@/components/home/vehicle-selector"
import { ResultsDisplay } from "@/components/home/results-display"
import { analysisConfig } from "@/config/analysis"
import { supportedVehicles } from "@/data/vehicles/supported-vehicles"

export function ResultLayout({ record }: { record: any }) {
    const [userConfirmed, setUserConfirmed] = useState(false)
    const [userRejected, setUserRejected] = useState(false)

    const { confidence, result_data, detected_products } = record
    const { primary } = result_data || {}
    
    const isMediumConfidence = confidence >= analysisConfig.confidenceThresholds.medium && confidence < analysisConfig.confidenceThresholds.high
    const isLowConfidence = confidence < analysisConfig.confidenceThresholds.medium

    const handleConfirm = () => setUserConfirmed(true)
    const handleReject = () => setUserRejected(true)

    // Disambiguate year if it contains a hyphen
    const needsYearDisambiguation = primary?.year?.includes('-') && !userConfirmed

    // Check if it's a catalog-supported vehicle
    const isSupported = primary && supportedVehicles.some(
        v => v.make.toLowerCase() === primary.make.toLowerCase() && v.model.toLowerCase() === primary.model.toLowerCase()
    )

    if (userRejected) {
        return (
            <div className="w-full max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-border">
                <h2 className="text-2xl font-bold mb-4">Let's find the right vehicle</h2>
                <p className="text-muted-foreground mb-8">Please select your vehicle manually below:</p>
                <VehicleSelector />
            </div>
        )
    }

    if (needsYearDisambiguation && !isLowConfidence) {
        return (
            <div className="w-full max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-border">
                <div className="mb-6 p-4 border rounded-xl border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <h4 className="font-semibold text-amber-800 text-sm">Partial Match</h4>
                    </div>
                    <p className="text-sm text-amber-700 ml-6">
                        We identified a {primary?.make} {primary?.model}, but we need the exact year.
                    </p>
                </div>
                <VehicleSelector />
            </div>
        )
    }

    if (isLowConfidence && !userConfirmed) {
        return (
            <div className="w-full max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-border text-center">
                <h2 className="text-2xl font-bold mb-2">We think this might be a:</h2>
                <p className="text-3xl font-extrabold text-primary mb-8">
                    {primary?.year} {primary?.make} {primary?.model} {primary?.trim}
                </p>
                
                <p className="text-muted-foreground mb-6">Is this correct?</p>
                <div className="flex items-center justify-center gap-4 mb-8">
                    <Button onClick={handleConfirm} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                        <Check className="w-5 h-5 mr-2" /> Yes, that's it
                    </Button>
                    <Button onClick={handleReject} size="lg" variant="outline">
                        <X className="w-5 h-5 mr-2" /> No, let me pick
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Medium Confidence Confirm/Correct Bar */}
            {isMediumConfidence && !userConfirmed && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-amber-900">Please verify our identification</p>
                            <p className="text-sm text-amber-800">
                                We identified this as a {primary?.year} {primary?.make} {primary?.model}, but we aren't completely sure.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button onClick={handleConfirm} size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                            Confirm
                        </Button>
                        <Button onClick={handleReject} size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                            Change
                        </Button>
                    </div>
                </div>
            )}

            {isSupported && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <p className="text-blue-800 font-medium text-sm">
                        ✨ Good news! We have a specialized catalog of curated parts for the {primary?.make} {primary?.model}. Check out our top picks below.
                    </p>
                </div>
            )}

            <ResultsDisplay 
                results={result_data} 
                detectedProducts={detected_products} 
                imageUrls={[record.image_url]}
                hideSaveActions={false}
            />
        </div>
    )
}
