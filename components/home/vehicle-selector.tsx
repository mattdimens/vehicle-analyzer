"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usVehicles, getUsModels, getUsModelYears } from "@/data/vehicles/us-vehicles"
import { resolveVehicleUrl, isVehicleSupported } from "@/data/vehicles/supported-vehicles"
import { ChevronRight, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Year/Make/Model vehicle selector panel.
 *
 * Provides full dropdown coverage of US makes and models, routing to
 * live catalog pages for supported vehicles and showing a fallback
 * message with photo-tool CTA for unsupported ones.
 *
 * All vehicle data flows from config files. No hardcoded vehicle names.
 */
interface VehicleSelectorProps {
  location?: 'hero' | 'results_correction' | 'degraded_state'
}

export function VehicleSelector({ location = 'hero' }: VehicleSelectorProps) {
  const router = useRouter()

  const [selectedMake, setSelectedMake] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [fallbackMessage, setFallbackMessage] = useState<{
    make: string
    model: string
  } | null>(null)

  // Models for selected make
  const availableModels = useMemo(() => getUsModels(selectedMake), [selectedMake])

  // Year range for selected model
  const availableYears = useMemo(() => getUsModelYears(selectedMake, selectedModel), [selectedMake, selectedModel])

  const handleMakeChange = useCallback((value: string) => {
    setSelectedMake(value)
    setSelectedModel("")
    setSelectedYear("")
    setFallbackMessage(null)
  }, [])

  const handleModelChange = useCallback((value: string) => {
    setSelectedModel(value)
    setSelectedYear("")
    setFallbackMessage(null)
  }, [])

  const handleYearChange = useCallback((value: string) => {
    setSelectedYear(value)
    setFallbackMessage(null)
  }, [])

  const canSubmit = selectedMake && selectedModel && selectedYear

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return

    const year = parseInt(selectedYear, 10)
    const supported = isVehicleSupported(selectedMake, selectedModel)

    import('@/lib/analytics').then(({ trackEvent, setEntryDoor }) => {
        trackEvent('ymm_selector_submitted', { supported, location })
        if (location === 'hero') {
            setEntryDoor('ymm_selector')
        }
    })

    // Fire-and-forget logging
    fetch("/api/log-vehicle-selector", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        make: selectedMake,
        model: selectedModel,
        year,
        supported,
      }),
    }).catch(() => {
      // Swallow logging errors silently
    })

    // Route to catalog page if supported
    const url = resolveVehicleUrl(selectedMake, selectedModel, year)
    if (url) {
      router.push(url)
      return
    }

    // Show fallback message for unsupported vehicles
    setFallbackMessage({ make: selectedMake, model: selectedModel })
  }, [canSubmit, selectedMake, selectedModel, selectedYear, router, location])

  const handleScrollToPhotoTool = useCallback(() => {
    const uploadTarget = document.getElementById("upload-zone")
    if (uploadTarget) {
      uploadTarget.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      // Results and error pages have no photo tool; send the user to it
      router.push("/#upload-zone")
    }
  }, [router])

  const selectBaseClass =
    "h-11 w-full rounded-lg border border-[#B9C5CF] bg-white px-3 text-sm font-medium text-[#17212B] shadow-xs transition-colors hover:bg-[#F4F7F9] focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
  const labelClass = "block text-xs font-semibold text-[#5A6672] mb-1.5 uppercase tracking-wider"

  return (
    <div className="flex flex-col h-full">
      {/* On /r/ pages the surrounding card has its own heading */}
      {location === 'hero' && (
        <h2 className="font-heading text-xl md:text-2xl font-bold text-[#17212B] mb-6">
          Or pick your vehicle
        </h2>
      )}

      <div className="space-y-4 flex-1">
        {/* Make */}
        <div>
          <label htmlFor="selector-make" className={labelClass}>
            Make
          </label>
          <select
            id="selector-make"
            value={selectedMake}
            onChange={(e) => handleMakeChange(e.target.value)}
            className={selectBaseClass}
            aria-label="Select vehicle make"
          >
            <option value="">Select make</option>
            {usVehicles.map((make) => (
              <option key={make.name} value={make.name}>
                {make.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <label htmlFor="selector-model" className={labelClass}>
            Model
          </label>
          <select
            id="selector-model"
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className={selectBaseClass}
            disabled={!selectedMake}
            aria-label="Select vehicle model"
          >
            <option value="">
              {selectedMake ? "Select model" : "Select a make first"}
            </option>
            {availableModels.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label htmlFor="selector-year" className={labelClass}>
            Year
          </label>
          <select
            id="selector-year"
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className={selectBaseClass}
            disabled={!selectedModel}
            aria-label="Select vehicle year"
          >
            <option value="">
              {selectedModel ? "Select year" : "Select a model first"}
            </option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fallback message for unsupported vehicles */}
      {fallbackMessage && (
        <div className="mt-4 rounded-lg bg-[#F4F7F9] border border-[#D5DEE5] p-4">
          <p className="text-sm text-[#2B3742] leading-relaxed">
            We have not built the {fallbackMessage.make} {fallbackMessage.model} catalog yet,
            but our analyzer can identify your vehicle and find compatible parts right now.
          </p>
          <Button
            onClick={handleScrollToPhotoTool}
            variant="outline"
            size="sm"
            className="mt-3 border-[#17212B] bg-white text-[#17212B]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Analyze My Photo Instead
          </Button>
        </div>
      )}

      {/* Submit button */}
      {!fallbackMessage && (
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-6 w-full h-12 text-base font-semibold"
          size="lg"
        >
          Shop Accessories
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      )}
    </div>
  )
}
