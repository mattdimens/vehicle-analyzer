import type { PartIdentification } from "@/app/actions"

/** How the visitor's vehicle was chosen on a part result. */
export type PartVehicleMethod = "detected" | "garage" | "ymm"

export interface PartVehicleChoice {
    method: PartVehicleMethod
    label: string
}

/** sessionStorage key for the vehicle chosen on part results this session. */
export const PART_VEHICLE_STORAGE_KEY = "vf_part_vehicle"

const MAX_LABEL_LENGTH = 60

/**
 * The vehicle chip a part result starts with: the model's searchVehicle, or
 * estimatedVehicle with parenthetical notes dropped ("Audi / Volkswagen
 * (FSI/TFSI engines)" becomes "Audi / Volkswagen"). Null when neither is known.
 */
export function detectedVehicleLabel(part: Pick<PartIdentification, "estimatedVehicle" | "searchVehicle">): string | null {
    const searchVehicle = part.searchVehicle?.trim()
    if (searchVehicle) return searchVehicle.slice(0, MAX_LABEL_LENGTH)
    const cleaned = (part.estimatedVehicle ?? "")
        .replace(/\([^)]*\)/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    return cleaned ? cleaned.slice(0, MAX_LABEL_LENGTH).trim() : null
}

/** A stored choice, or null when it's missing or not one we wrote. */
export function parsePartVehicleChoice(raw: string | null): PartVehicleChoice | null {
    if (!raw) return null
    try {
        const value = JSON.parse(raw) as Partial<PartVehicleChoice> | null
        if (!value || typeof value.label !== "string" || !value.label.trim()) return null
        if (value.method !== "detected" && value.method !== "garage" && value.method !== "ymm") return null
        return { method: value.method, label: value.label.trim().slice(0, MAX_LABEL_LENGTH) }
    } catch {
        return null
    }
}

export function readPartVehicleChoice(): PartVehicleChoice | null {
    try {
        return parsePartVehicleChoice(window.sessionStorage.getItem(PART_VEHICLE_STORAGE_KEY))
    } catch {
        return null
    }
}

export function savePartVehicleChoice(choice: PartVehicleChoice) {
    try {
        window.sessionStorage.setItem(PART_VEHICLE_STORAGE_KEY, JSON.stringify(choice))
    } catch {
        // Private mode or storage blocked: the choice just isn't remembered
    }
}

/**
 * The vehicle a new part result starts with. A garage or Year/Make/Model
 * vehicle chosen earlier this session carries over. A detected vehicle
 * chosen earlier doesn't (it belonged to that part), so each part starts
 * with its own detected vehicle.
 */
export function initialPartVehicle(stored: PartVehicleChoice | null, detected: string | null): PartVehicleChoice | null {
    if (stored && stored.method !== "detected") return stored
    return detected ? { method: "detected", label: detected } : null
}

/**
 * The part as the shop searches should see it. A vehicle the visitor chose
 * (garage or Year/Make/Model) replaces the vehicle in every search; the
 * detected vehicle leaves the part's own search fields as they are.
 */
export function partForVehicle(part: PartIdentification, choice: PartVehicleChoice | null): PartIdentification {
    if (!choice || choice.method === "detected") return part
    return { ...part, searchVehicle: choice.label }
}

/** "2019 Toyota Tacoma" from a garage row or the picker. */
export function formatVehicleLabel(year: number | string | null | undefined, make: string, model: string): string {
    return [year, make, model].filter(part => part !== null && part !== undefined && String(part).trim() !== "").join(" ").trim()
}
