"use client"

import { useId, useMemo, useState } from "react"
import { Check } from "lucide-react"
import { getUsModels, getUsModelYears, usVehicles } from "@/data/vehicles/us-vehicles"
import { useGarageVehicleLabels } from "@/hooks/use-garage-vehicle-labels"
import { formatVehicleLabel, type PartVehicleChoice } from "@/lib/part-vehicle"
import { cn } from "@/lib/utils"

interface PartVehiclePickerProps {
    /** The vehicle detected from the part, if any. */
    detected: string | null
    selected: PartVehicleChoice | null
    onSelect: (choice: PartVehicleChoice) => void
}

const selectClass =
    "h-11 w-full appearance-none rounded-[10px] border border-[#B9C5CF] bg-white px-3 text-sm font-medium text-[#17212B] focus:border-[#17212B] focus:outline-none focus:ring-2 focus:ring-[#17212B]/15 disabled:bg-[#F4F7F9] disabled:text-[#8A96A1]"

/**
 * "Which vehicle is it for?" chips in the part shop block: the detected
 * vehicle, the visitor's two newest garage vehicles, and "+ Add my vehicle"
 * for an inline Year / Make / Model picker.
 */
export function PartVehiclePicker({ detected, selected, onSelect }: PartVehiclePickerProps) {
    const garageLabels = useGarageVehicleLabels(2)
    const [isPicking, setIsPicking] = useState(false)
    // A picked (or carried-over) vehicle stays a chip after switching away from it
    const [ownVehicle, setOwnVehicle] = useState<PartVehicleChoice | null>(
        selected && selected.method !== "detected" ? selected : null
    )

    const chips = useMemo(() => {
        const list: PartVehicleChoice[] = []
        const seen = new Set<string>()
        const add = (choice: PartVehicleChoice) => {
            const key = choice.label.toLowerCase()
            if (seen.has(key)) return
            seen.add(key)
            list.push(choice)
        }
        if (detected) add({ method: "detected", label: detected })
        garageLabels.forEach(label => add({ method: "garage", label }))
        // A vehicle carried over from earlier this session, even if it isn't listed above
        if (ownVehicle) add(ownVehicle)
        if (selected) add(selected)
        return list
    }, [detected, garageLabels, ownVehicle, selected])

    const isSelected = (chip: PartVehicleChoice) =>
        selected?.label.toLowerCase() === chip.label.toLowerCase()

    return (
        <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-[#5A6672]">Which vehicle is it for?</p>
            <div className="flex flex-wrap gap-2">
                {chips.map(chip => {
                    const active = isSelected(chip)
                    return (
                        <button
                            key={`${chip.method}-${chip.label}`}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                                if (!active) onSelect(chip)
                            }}
                            className={cn(
                                "flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-3.5 text-left text-sm font-semibold transition-colors",
                                active
                                    ? "border-2 border-[#17212B] bg-[#17212B] text-white"
                                    : "border border-[#B9C5CF] bg-white text-[#17212B] hover:border-[#17212B]"
                            )}
                        >
                            {active && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />}
                            <span className="truncate">{chip.label}</span>
                        </button>
                    )
                })}
                {!isPicking && (
                    <button
                        type="button"
                        onClick={() => setIsPicking(true)}
                        className="min-h-11 rounded-full border border-dashed border-[#8A96A1] bg-white px-3.5 text-sm font-semibold text-[#17212B] transition-colors hover:border-[#17212B]"
                    >
                        + Add my vehicle
                    </button>
                )}
            </div>
            {detected && selected?.method === "detected" && !isPicking && (
                <p className="text-xs text-[#5A6672]">Detected from the part. Add your year, make and model to narrow the search.</p>
            )}
            {isPicking && (
                <YearMakeModelForm
                    onCancel={() => setIsPicking(false)}
                    onSubmit={label => {
                        setIsPicking(false)
                        setOwnVehicle({ method: "ymm", label })
                        onSelect({ method: "ymm", label })
                    }}
                />
            )}
        </div>
    )
}

function YearMakeModelForm({ onSubmit, onCancel }: { onSubmit: (label: string) => void; onCancel: () => void }) {
    const [make, setMake] = useState("")
    const [model, setModel] = useState("")
    const [year, setYear] = useState("")
    const models = useMemo(() => getUsModels(make), [make])
    const years = useMemo(() => getUsModelYears(make, model), [make, model])
    const baseId = useId()
    const canSubmit = Boolean(make && model && year)

    return (
        <form
            aria-label="Add your vehicle"
            className="flex flex-col gap-2.5 rounded-xl border border-[#D5DEE5] bg-[#F4F7F9] p-3"
            onSubmit={e => {
                e.preventDefault()
                if (canSubmit) onSubmit(formatVehicleLabel(year, make, model))
            }}
        >
            <div className="grid grid-cols-1 gap-2 @sm/shop:grid-cols-3">
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${baseId}-make`} className="text-xs font-semibold text-[#5A6672]">Make</label>
                    <select
                        id={`${baseId}-make`}
                        value={make}
                        onChange={e => {
                            setMake(e.target.value)
                            setModel("")
                            setYear("")
                        }}
                        className={selectClass}
                    >
                        <option value="">Select make</option>
                        {usVehicles.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${baseId}-model`} className="text-xs font-semibold text-[#5A6672]">Model</label>
                    <select
                        id={`${baseId}-model`}
                        value={model}
                        disabled={!make}
                        onChange={e => {
                            setModel(e.target.value)
                            setYear("")
                        }}
                        className={selectClass}
                    >
                        <option value="">{make ? "Select model" : "Select a make first"}</option>
                        {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${baseId}-year`} className="text-xs font-semibold text-[#5A6672]">Year</label>
                    <select
                        id={`${baseId}-year`}
                        value={year}
                        disabled={!model}
                        onChange={e => setYear(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">{model ? "Select year" : "Select a model first"}</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="min-h-11 flex-1 rounded-[10px] bg-[#17212B] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#2B3742] disabled:cursor-not-allowed disabled:bg-[#B9C5CF]"
                >
                    Use this vehicle
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="min-h-11 rounded-[10px] border-[1.5px] border-[#D5DEE5] bg-white px-3.5 text-sm font-semibold text-[#17212B] hover:bg-white/70"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}
